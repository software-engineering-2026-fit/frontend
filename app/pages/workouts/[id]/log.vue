<script setup lang="ts">
import { messageFrom } from '../../../composables/useAuth'
import type { WorkoutLogExercise, Workout } from '../../../composables/useWorkouts'
import type { WorkoutExercise } from '../../../composables/useWorkoutApi'

interface SessionExercise {
  planned: WorkoutExercise
  weight: number | ''
  sets: number
  reps: number
  exhaustionLevel: number | ''
}

const route = useRoute()
const api = useWorkoutApi()
const workoutData = useWorkouts()
const workout = ref<Workout | null>(null)
const exercises = ref<SessionExercise[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)
const saved = ref(false)

useHead({ title: 'Log workout | Fit' })

const isValid = computed(() => {
  const date = workoutData.logDate.value
  const [year, month, day] = date.split('-').map(Number)
  const parsedDate = new Date(year, month - 1, day)
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
    && parsedDate.getFullYear() === year
    && parsedDate.getMonth() === month - 1
    && parsedDate.getDate() === day
  return Boolean(workout.value)
    && validDate
    && exercises.value.length > 0
    && exercises.value.every(item =>
      Number.isInteger(item.sets)
      && item.sets > 0
      && Number.isInteger(item.reps)
      && item.reps > 0
      && (item.weight === '' || (Number.isFinite(item.weight) && item.weight >= 0))
      && (
        item.exhaustionLevel === ''
        || (Number.isInteger(item.exhaustionLevel) && item.exhaustionLevel >= 1 && item.exhaustionLevel <= 5)
      )
    )
})

onMounted(async () => {
  void workoutData.loadWorkoutLogs()
  try {
    const workoutId = String(route.params.id)
    const [workoutResult, planExercises] = await Promise.all([
      api.getWorkout(workoutId),
      api.getWorkoutExercises(workoutId)
    ])
    workout.value = workoutResult
    exercises.value = planExercises.map(planned => ({
      planned,
      weight: planned.weight_kg ?? '',
      sets: planned.sets ?? 3,
      reps: planned.reps ?? 10,
      exhaustionLevel: planned.exhaustion_level ?? ''
    }))
  } catch (error) {
    errorMessage.value = messageFrom(error)
  } finally {
    isLoading.value = false
  }
})

async function saveSession() {
  if (!workout.value || !isValid.value || isSaving.value) {
    return
  }

  isSaving.value = true
  errorMessage.value = null
  const results: WorkoutLogExercise[] = exercises.value.map(item => ({
    exerciseId: item.planned.exercise.id,
    exerciseName: item.planned.exercise.name,
    weight: item.weight === '' ? null : item.weight,
    sets: item.sets,
    reps: item.reps,
    exhaustionLevel: item.exhaustionLevel === '' ? null : item.exhaustionLevel
  }))

  saved.value = await workoutData.logWorkout(workout.value, results)
  if (!saved.value) {
    errorMessage.value = workoutData.errorMessage.value
  }
  isSaving.value = false
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
        <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Log your workout</h1>
        <p class="mt-2 text-sm text-slate-600">{{ workout.name }}</p>
      </header>

      <form class="mt-7 space-y-4" @submit.prevent="saveSession">
        <section class="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
          <label for="workout-date" class="block max-w-xs text-sm font-semibold text-slate-800">
            Workout date
            <input
              id="workout-date"
              v-model="workoutData.logDate.value"
              class="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              required
              type="date"
            >
          </label>

          <div class="mt-6 flex items-end justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Completed exercises</h2>
              <p class="mt-1 text-sm text-slate-500">Adjust the plan values to record what you completed.</p>
            </div>
            <span class="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">{{ exercises.length }}</span>
          </div>

          <p v-if="!exercises.length" class="py-9 text-center text-sm text-slate-500">
            This workout has no exercises to log.
          </p>
          <ol v-else class="divide-y divide-slate-100">
            <li v-for="(item, index) in exercises" :key="item.planned.exercise.id" class="py-5">
              <div class="mb-4 flex items-center gap-3">
                <span class="grid size-9 place-items-center rounded-xl bg-violet-100 text-sm font-bold text-violet-800">{{ index + 1 }}</span>
                <div>
                  <h3 class="font-semibold text-slate-900">{{ item.planned.exercise.name }}</h3>
                  <p class="mt-0.5 text-xs text-slate-500">
                    Planned: {{ item.planned.sets ?? '—' }} sets × {{ item.planned.reps ?? '—' }} reps
                  </p>
                </div>
              </div>
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label class="text-xs font-semibold text-slate-700">
                  Weight (kg)
                  <input
                    v-model="item.weight"
                    class="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    min="0"
                    placeholder="Bodyweight / not tracked"
                    step="0.5"
                    type="number"
                  >
                </label>
                <label class="text-xs font-semibold text-slate-700">
                  Reps per set
                  <input
                    v-model.number="item.reps"
                    class="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    min="1"
                    required
                    step="1"
                    type="number"
                  >
                </label>
                <label class="text-xs font-semibold text-slate-700">
                  Sets completed
                  <input
                    v-model.number="item.sets"
                    class="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    min="1"
                    required
                    step="1"
                    type="number"
                  >
                </label>
                <label class="text-xs font-semibold text-slate-700">
                  Effort (1–5)
                  <input
                    v-model.number="item.exhaustionLevel"
                    class="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
        </section>

        <p v-if="errorMessage" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{{ errorMessage }}</p>
        <p v-if="saved" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
          Workout logged for {{ workoutData.formatDate(workoutData.logDate.value) }} and synced with the API.
        </p>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <NuxtLink
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            :to="`/workouts/${workout.id}`"
          >
            Cancel
          </NuxtLink>
          <button
            class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            :disabled="!isValid || isSaving || saved"
          >
            {{ isSaving ? 'Saving workout…' : saved ? 'Workout logged' : 'Save workout log' }}
          </button>
        </div>
      </form>
    </template>
  </main>
</template>
