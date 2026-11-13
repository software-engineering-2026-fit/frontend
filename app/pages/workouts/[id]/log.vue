<script setup lang="ts">
import { messageFrom } from '../../../composables/useAuth'
import type { Workout } from '../../../composables/useWorkouts'
import type {
  WorkoutExercise,
  WorkoutSession,
  WorkoutSessionLogInput
} from '../../../composables/useWorkoutApi'

interface ExerciseLogRow {
  key: number
  logId: string | null
  weight: number | ''
  reps: number | ''
  exhaustionLevel: number | ''
}

interface SessionExercise {
  planned: WorkoutExercise
  rows: ExerciseLogRow[]
}

const route = useRoute()
const router = useRouter()
const api = useWorkoutApi()
const workoutData = useWorkouts()
const sessionId = computed(() => {
  const value = route.query.sessionId
  return typeof value === 'string' ? value : null
})
const workout = ref<Workout | null>(null)
const activeSession = ref<WorkoutSession | null>(null)
const exercises = ref<SessionExercise[]>([])
const isLoading = ref(true)
const isFinishing = ref(false)
const errorMessage = ref<string | null>(null)
const autoSyncStatus = ref<'idle' | 'pending' | 'saving' | 'saved' | 'invalid' | 'error'>('idle')
const saved = ref(false)
let autoSyncTimer: ReturnType<typeof setTimeout> | undefined
let autoSyncRequested = false
let autoSyncTask: Promise<boolean> | null = null
let nextRowKey = 0

useHead({ title: 'Log workout | Fit' })

onMounted(async () => {
  void workoutData.loadWorkoutLogs()
  try {
    const workoutId = String(route.params.id)
    const [workoutResult, planExercises] = await Promise.all([
      api.getWorkout(workoutId),
      api.getWorkoutExercises(workoutId)
    ])
    let session: WorkoutSession
    if (sessionId.value) {
      session = await api.getWorkoutSession(sessionId.value)
      if (session.ended_at !== null) {
        throw new Error('This workout session has already been completed.')
      }
      if (session.workout_id !== workoutId) {
        throw new Error('This session does not belong to the selected workout.')
      }
    } else {
      const currentDate = new Date()
      const today = [
        currentDate.getFullYear(),
        String(currentDate.getMonth() + 1).padStart(2, '0'),
        String(currentDate.getDate()).padStart(2, '0')
      ].join('-')
      const [year, month, day] = (workoutData.pendingLogDate.value ?? today).split('-').map(Number)
      const date = new Date(year, month - 1, day, 12).toISOString()
      session = await api.createWorkoutSession(workoutId, date)
      workoutData.pendingLogDate.value = null
      await router.replace({
        path: route.path,
        query: { ...route.query, sessionId: session.id }
      })
    }

    const date = new Date(session.date)
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    workoutData.logDate.value = localDate.toISOString().slice(0, 10)
    const existingLogs = new Map<string, typeof session.logs>()
    for (const log of session.logs) {
      const exerciseLogs = existingLogs.get(log.exercise_id) ?? []
      exerciseLogs.push(log)
      existingLogs.set(log.exercise_id, exerciseLogs)
    }

    activeSession.value = session
    workout.value = workoutResult
    exercises.value = planExercises.map(planned => {
      const logs = existingLogs.get(planned.exercise.id) ?? []
      return {
        planned,
        rows: logs.map(log => ({
          key: nextRowKey++,
          logId: log.id,
          weight: log.weight ?? '',
          reps: log.reps ?? '',
          exhaustionLevel: log.exhaustion_level ?? ''
        }))
      }
    })
  } catch (error) {
    errorMessage.value = messageFrom(error)
  } finally {
    isLoading.value = false
  }
})

function hasEntry(item: ExerciseLogRow): boolean {
  return item.weight !== '' || item.reps !== '' || item.exhaustionLevel !== ''
}

function isValidEntry(item: ExerciseLogRow): boolean {
  return (
    (item.reps === '' || (Number.isInteger(item.reps) && item.reps > 0))
    && (item.weight === '' || (Number.isFinite(item.weight) && item.weight >= 0))
    && (
      item.exhaustionLevel === ''
      || (Number.isInteger(item.exhaustionLevel) && item.exhaustionLevel >= 1 && item.exhaustionLevel <= 5)
    )
  )
}

function scheduleAutoSync() {
  if (!activeSession.value || activeSession.value.ended_at || isLoading.value) {
    return
  }

  autoSyncStatus.value = 'pending'
  errorMessage.value = null
  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer)
  }
  autoSyncTimer = setTimeout(() => {
    void flushAutoSync()
  }, 600)
}

watch(
  () => JSON.stringify(exercises.value.map(item => [
    item.planned.exercise.id,
    item.rows.map(row => [row.weight, row.reps, row.exhaustionLevel])
  ])),
  scheduleAutoSync
)

onBeforeUnmount(() => {
  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer)
    autoSyncTimer = undefined
  }
})

function flushAutoSync(): Promise<boolean> {
  if (!activeSession.value || activeSession.value.ended_at) {
    return Promise.resolve(true)
  }

  autoSyncRequested = true
  if (autoSyncTask) {
    return autoSyncTask
  }

  autoSyncTask = (async () => {
    let succeeded = true
    let hasInvalidEntries = false
    autoSyncStatus.value = 'saving'

    while (autoSyncRequested && succeeded) {
      autoSyncRequested = false
      for (const exercise of exercises.value) {
        for (const row of exercise.rows) {
          const session = activeSession.value
          if (!session || session.ended_at) {
            break
          }
          if (!row.logId && !hasEntry(row)) {
            continue
          }
          if (!isValidEntry(row)) {
            hasInvalidEntries = true
            continue
          }

          const payload: WorkoutSessionLogInput = {
            exercise_id: exercise.planned.exercise.id,
            weight: row.weight === '' ? null : row.weight,
            reps: row.reps === '' ? null : row.reps,
            exhaustion_level: row.exhaustionLevel === '' ? null : row.exhaustionLevel
          }

          try {
            const currentLog = row.logId
              ? session.logs.find(log => log.id === row.logId)
              : undefined
            if (
              currentLog
              && currentLog.weight === payload.weight
              && currentLog.reps === payload.reps
              && currentLog.exhaustion_level === payload.exhaustion_level
            ) {
              continue
            }

            const updatedLog = row.logId
              ? await api.updateWorkoutSessionLog(session.id, row.logId, payload)
              : await api.addWorkoutSessionLog(session.id, payload)
            row.logId = updatedLog.id
            activeSession.value = {
              ...session,
              logs: [
                ...session.logs.filter(log => log.id !== updatedLog.id),
                updatedLog
              ].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
            }
          } catch (error) {
            errorMessage.value = `Could not sync workout progress. ${messageFrom(error)}`
            autoSyncStatus.value = 'error'
            succeeded = false
            break
          }
        }
        if (!succeeded) {
          break
        }
      }
    }

    if (succeeded) {
      autoSyncStatus.value = hasInvalidEntries ? 'invalid' : 'saved'
    }
    return succeeded && !hasInvalidEntries
  })()

  const task = autoSyncTask
  void task.finally(() => {
    if (autoSyncTask === task) {
      autoSyncTask = null
    }
  })
  return task
}

function addLogRow(exercise: SessionExercise) {
  exercise.rows.push({
    key: nextRowKey++,
    logId: null,
    weight: '',
    reps: '',
    exhaustionLevel: ''
  })
}

async function finishSession() {
  if (!activeSession.value || activeSession.value.ended_at || isFinishing.value) {
    return
  }

  isFinishing.value = true
  errorMessage.value = null
  try {
    if (autoSyncTimer) {
      clearTimeout(autoSyncTimer)
      autoSyncTimer = undefined
    }
    if (!await flushAutoSync()) {
      return
    }
    activeSession.value = await api.endWorkoutSession(activeSession.value.id)
    saved.value = true
    await workoutData.loadWorkoutLogs()
  } catch (error) {
    errorMessage.value = messageFrom(error)
  } finally {
    isFinishing.value = false
  }
}
</script>

<template>
  <main class="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
    <NuxtLink
      class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-violet-800"
      :to="workout ? `/workouts/${workout.id}` : '/workouts'"
    >
      <span aria-hidden="true">←</span> Workout details
    </NuxtLink>

    <div v-if="isLoading" class="mt-8 rounded-3xl border border-violet-100 bg-white px-5 py-16 text-center text-sm text-slate-500" aria-live="polite">
      Loading workout…
    </div>
    <section v-else-if="errorMessage && !workout" class="mt-8 rounded-3xl border border-rose-200 bg-white p-6 shadow-sm" role="alert">
      <h1 class="text-xl font-bold text-slate-900">Could not load this workout</h1>
      <p class="mt-2 text-sm text-rose-800">{{ errorMessage }}</p>
      <NuxtLink class="mt-5 inline-flex min-h-10 items-center rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800" to="/workouts">
        Back to workout plans
      </NuxtLink>
    </section>
    <template v-else-if="workout">
      <header class="mt-7">
        <p class="mb-2 text-xs font-bold tracking-[0.18em] text-violet-700">TRACK YOUR PROGRESS</p>
        <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {{ activeSession ? 'Continue your workout' : 'Log your workout' }}
        </h1>
        <p class="mt-2 text-sm text-slate-600">{{ workout.name }}</p>
      </header>

      <div class="mt-7 space-y-4">
        <section class="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
          <div class="flex items-end justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Exercise logs</h2>
              <p class="mt-1 text-sm text-slate-500">Add a row for each set or exercise entry.</p>
            </div>
            <span class="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">{{ exercises.length }}</span>
          </div>

          <p v-if="!exercises.length" class="py-9 text-center text-sm text-slate-500">
            This workout has no exercises.
          </p>
          <ol v-else class="divide-y divide-slate-100">
            <li v-for="(item, index) in exercises" :key="item.planned.exercise.id" class="py-5">
              <div class="mb-4 flex items-center gap-3">
                <span class="grid size-9 place-items-center rounded-xl bg-violet-100 text-sm font-bold text-violet-800">{{ index + 1 }}</span>
                <div>
                  <h3 class="font-semibold text-slate-900">{{ item.planned.exercise.name }}</h3>
                  <p v-if="item.planned.description" class="mt-0.5 text-xs text-slate-500">
                    {{ item.planned.description }}
                  </p>
                </div>
              </div>
              <ol class="space-y-3">
                <li
                  v-for="(row, rowIndex) in item.rows"
                  :key="row.key"
                  class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Log {{ rowIndex + 1 }}
                  </p>
                  <div class="grid gap-3 sm:grid-cols-3">
                    <label class="text-xs font-semibold text-slate-700">
                      Weight (kg)
                      <input
                        v-model="row.weight"
                        class="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
                        :disabled="isFinishing || Boolean(activeSession?.ended_at)"
                        min="0"
                        placeholder="Optional"
                        step="0.5"
                        type="number"
                      >
                    </label>
                    <label class="text-xs font-semibold text-slate-700">
                      Reps completed
                      <input
                        v-model.number="row.reps"
                        class="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
                        :disabled="isFinishing || Boolean(activeSession?.ended_at)"
                        min="1"
                        step="1"
                        type="number"
                      >
                    </label>
                    <label class="text-xs font-semibold text-slate-700">
                      Effort (1–5)
                      <input
                        v-model.number="row.exhaustionLevel"
                        class="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
                        :disabled="isFinishing || Boolean(activeSession?.ended_at)"
                        max="5"
                        min="1"
                        placeholder="Optional"
                        step="1"
                        type="number"
                      >
                    </label>
                  </div>
                </li>
              </ol>
              <button
                v-if="!activeSession?.ended_at"
                class="mt-3 inline-flex min-h-9 items-center rounded-lg border border-violet-200 px-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-50 disabled:opacity-50"
                type="button"
                :disabled="isFinishing"
                @click="addLogRow(item)"
              >
                + Add row
              </button>
            </li>
          </ol>
        </section>

        <p v-if="activeSession" class="text-sm text-slate-600" role="status" aria-live="polite">
          <template v-if="autoSyncStatus === 'saving'">Syncing changes…</template>
          <template v-else-if="autoSyncStatus === 'pending'">Changes waiting to sync…</template>
          <template v-else-if="autoSyncStatus === 'saved'">All changes synced.</template>
          <template v-else-if="autoSyncStatus === 'invalid'">Check invalid values; valid rows are synced automatically.</template>
          <template v-else-if="autoSyncStatus === 'error'">Changes could not be synced. Edit a value to retry.</template>
          <template v-else>Changes sync automatically.</template>
        </p>
        <p v-if="errorMessage" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{{ errorMessage }}</p>
        <p v-if="saved" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
          Workout completed for {{ workoutData.formatDate(workoutData.logDate.value) }} and synced with the API.
        </p>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <NuxtLink
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            :to="`/`"
          >
            Back
          </NuxtLink>
          <button
            v-if="activeSession && !activeSession.ended_at"
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-200 bg-white px-5 text-sm font-semibold text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            :disabled="isFinishing || autoSyncStatus === 'saving'"
            @click="finishSession"
          >
            {{ isFinishing ? 'Finishing workout…' : 'Finish workout' }}
          </button>
        </div>
      </div>
    </template>
  </main>
</template>
