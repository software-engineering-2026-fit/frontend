<script setup lang="ts">
import { messageFrom } from '../../../composables/useAuth'
import type { Workout } from '../../../composables/useWorkouts'
import type { WorkoutExercise } from '../../../composables/useWorkoutApi'

const route = useRoute()
const api = useWorkoutApi()
const workoutData = useWorkouts()
const workout = ref<Workout | null>(null)
const exercises = ref<WorkoutExercise[]>([])
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

useHead({ title: 'Workout plan | Fit' })

onMounted(async () => {
  void workoutData.loadWorkoutLogs()
  try {
    const workoutId = String(route.params.id)
    const [workoutResult, exerciseResult] = await Promise.all([
      api.getWorkout(workoutId),
      api.getWorkoutExercises(workoutId)
    ])
    workout.value = workoutResult
    exercises.value = exerciseResult
  } catch (error) {
    errorMessage.value = messageFrom(error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <main class="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
    <NuxtLink
      class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-violet-800"
      to="/workouts"
    >
      <span aria-hidden="true">←</span> Workout plans
    </NuxtLink>

    <div v-if="isLoading" class="mt-8 rounded-3xl border border-violet-100 bg-white px-5 py-16 text-center text-sm text-slate-500" aria-live="polite">
      Loading workout plan…
    </div>
    <section v-else-if="errorMessage" class="mt-8 rounded-3xl border border-rose-200 bg-white p-6 shadow-sm sm:p-9" role="alert">
      <h1 class="text-xl font-bold text-slate-900">Could not load this workout</h1>
      <p class="mt-2 text-sm text-rose-800">{{ errorMessage }}</p>
      <NuxtLink class="mt-5 inline-flex min-h-10 items-center rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800" to="/workouts">
        Back to workout plans
      </NuxtLink>
    </section>
    <template v-else-if="workout">
      <header class="mt-7 flex flex-col gap-5 rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50 to-fuchsia-50 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-9">
        <div>
          <p class="mb-2 text-xs font-bold tracking-[0.18em] text-violet-700">YOUR TRAINING PLAN</p>
          <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{{ workout.name }}</h1>
          <p v-if="workout.description" class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{{ workout.description }}</p>
          <p class="mt-3 text-sm text-slate-500">{{ exercises.length }} {{ exercises.length === 1 ? 'exercise' : 'exercises' }}</p>
        </div>
        <NuxtLink
          class="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800"
          :to="`/workouts/${workout.id}/log`"
        >
          Log this workout
          <span aria-hidden="true">→</span>
        </NuxtLink>
      </header>

      <section class="mt-6 overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm" aria-labelledby="exercise-list-title">
        <div class="flex items-center justify-between border-b border-violet-100 px-5 py-4 sm:px-7">
          <div>
            <h2 id="exercise-list-title" class="text-lg font-bold text-slate-900">Exercise plan</h2>
            <p class="mt-0.5 text-sm text-slate-500">Targets for your next session</p>
          </div>
          <span class="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">{{ exercises.length }} total</span>
        </div>

        <p v-if="!exercises.length" class="px-5 py-12 text-center text-sm text-slate-500 sm:px-7">
          This plan has no exercises yet.
        </p>
        <div v-else>
          <div class="hidden grid-cols-[minmax(0,1fr)_120px_100px_100px_100px] gap-4 bg-slate-50 px-7 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Exercise</span>
            <span>description</span>
          </div>
          <ol class="divide-y divide-slate-100">
            <li v-for="(item, index) in exercises" :key="item.exercise.id" class="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_120px_100px_100px_100px] sm:items-center sm:gap-4 sm:px-7">
              <div class="flex min-w-0 items-center gap-3">
                <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-sm font-bold text-violet-800">{{ index + 1 }}</span>
                <div class="min-w-0">
                  <h3 class="truncate text-sm font-semibold text-slate-900">{{ item.exercise.name }}</h3>
                  <p class="mt-0.5 truncate text-xs text-slate-500">
                    {{ [item.exercise.muscle_group, item.exercise.equipment].filter(Boolean).join(' · ') || item.exercise.description || 'Exercise' }}
                  </p>
                </div>
              </div>
              
              <span class="hidden text-sm font-medium text-slate-700 sm:block">{{ item.description ?? '—' }}</span>
            </li>
          </ol>
        </div>

        <div class="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
          <p class="text-xs leading-5 text-slate-500">
            Workout targets and exercise details are synced with the API.
          </p>
        </div>
      </section>

      <section v-if="workoutData.lastLogFor(workout.id)" class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-fuchsia-100 bg-white px-5 py-4 shadow-sm">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Last completed</p>
          <p class="mt-1 text-sm font-semibold text-slate-900">
            {{ workoutData.formatDate(workoutData.lastLogFor(workout.id)!.date) }}
          </p>
        </div>
        <span class="rounded-full bg-fuchsia-50 px-3 py-1.5 text-xs font-semibold text-fuchsia-800">Saved to your account</span>
      </section>
    </template>
  </main>
</template>
