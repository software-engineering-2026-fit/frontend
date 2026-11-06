<script setup lang="ts">
const workoutData = useWorkouts()
const sortByLastLogged = ref(true)

useHead({ title: 'Workouts | Fit' })

const visibleWorkouts = computed(() => {
  const result = [...workoutData.sortedWorkouts.value]
  if (!sortByLastLogged.value) {
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }
  return result
})

onMounted(() => {
  void workoutData.loadWorkoutLogs()
  void workoutData.loadWorkouts()
})
</script>

<template>
  <main class="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
    <div class="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="mb-2 text-xs font-bold tracking-[0.18em] text-violet-700">YOUR TRAINING, IN FOCUS</p>
        <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Workouts</h1>
        <p class="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          Choose a plan, show up, and keep your progress moving.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div class="hidden rounded-2xl border border-violet-100 bg-white/80 px-5 py-3 text-right shadow-sm sm:block">
          <span class="block text-2xl font-bold tracking-tight text-violet-800">
            {{ workoutData.workouts.value.length }}
          </span>
          <span class="text-xs font-medium text-slate-500">workout plans</span>
        </div>
        <NuxtLink
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800"
          to="/workouts/new"
        >
          <span aria-hidden="true">+</span> Create workout
        </NuxtLink>
      </div>
    </div>

    <section
      class="overflow-hidden rounded-3xl border border-violet-100 bg-white/90 shadow-[0_20px_60px_-35px_rgba(91,33,182,0.3)]"
      aria-labelledby="active-title"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-5 py-4 sm:px-7">
        <div>
          <h2 id="active-title" class="text-lg font-bold text-slate-900">Active plans</h2>
          <p class="mt-0.5 text-xs text-slate-500">Your personal training library</p>
        </div>
        <span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-100">
          {{ workoutData.workouts.value.length }}
          {{ workoutData.workouts.value.length === 1 ? 'plan' : 'plans' }}
        </span>
      </div>

      <div class="px-4 py-5 sm:px-7 sm:py-6">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-slate-700">Workout plans</h3>
        <button
          class="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
          type="button"
          :aria-pressed="sortByLastLogged"
          @click="sortByLastLogged = !sortByLastLogged"
        >
          <svg class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m4 6 4 4 4-4" />
          </svg>
          {{ sortByLastLogged ? 'Recently logged' : 'Sort by name' }}
        </button>
      </div>

      <p v-if="workoutData.errorMessage.value" class="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
        {{ workoutData.errorMessage.value }}
      </p>
      <p v-if="workoutData.successMessage.value" class="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
        <svg class="size-5 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="m4 10 4 4 8-8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
        </svg>
        {{ workoutData.successMessage.value }}
      </p>

      <div v-if="workoutData.isLoading.value" class="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 px-5 py-12 text-center text-sm text-slate-500" aria-live="polite">
        Loading workout plans…
      </div>
      <div
        v-else-if="!workoutData.workouts.value.length && !workoutData.errorMessage.value"
        class="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 px-5 py-12 text-center"
      >
        <span class="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-violet-100 text-violet-700">
          <svg class="size-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 4h12a2 2 0 0 1 2 2v14l-8-4-8 4V6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.6" />
          </svg>
        </span>
        <strong class="block text-sm font-semibold text-slate-800">No workout plans yet</strong>
        <span class="mt-1 block text-sm text-slate-500">Your workout plans will appear here when they are available.</span>
      </div>
      <div v-else class="grid gap-3">
        <article
          v-for="workout in visibleWorkouts"
          :key="workout.id"
          class="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:p-5"
        >
          <div class="flex min-w-0 items-start gap-3 sm:gap-4">
            <span class="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-800">
              <svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 9v6m12-6v6M3 10v4m18-4v4M6 12h12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
              </svg>
            </span>
            <div class="min-w-0">
              <h3 class="truncate text-base font-semibold text-slate-900 sm:text-lg">{{ workout.name }}</h3>
              <p v-if="workout.description" class="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
              {{ workout.description }}
              </p>
              <p class="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <svg class="size-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5" />
                <path d="M10 6v4l2.5 1.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
              </svg>
              <span>Last logged</span>
              <time
                v-if="workoutData.lastLogFor(workout.id)"
                class="font-medium text-slate-700"
                :datetime="workoutData.lastLogFor(workout.id)?.date"
              >
                {{ workoutData.formatDate(workoutData.lastLogFor(workout.id)!.date) }}
              </time>
              <span v-else class="font-medium text-slate-700">Not yet</span>
              </p>
            </div>
          </div>
          <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
            <NuxtLink
              class="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 sm:min-h-10 sm:px-4 sm:text-sm"
              :to="`/workouts/${workout.id}`"
            >
              View plan
            </NuxtLink>
            <NuxtLink
              class="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-violet-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 sm:min-h-10 sm:px-4 sm:text-sm"
              :to="`/workouts/${workout.id}/log`"
            >
              <span aria-hidden="true">+</span>
              <span>Log workout</span>
            </NuxtLink>
          </div>
        </article>
      </div>

      <div v-if="workoutData.workoutHistory.value.length" class="mt-8 border-t border-slate-100 pt-6">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-slate-800">Recent activity</h3>
          <span class="text-xs text-slate-400">Synced with the API</span>
        </div>
        <ol class="divide-y divide-slate-100">
          <li
            v-for="(log, index) in workoutData.workoutHistory.value"
            :key="`${log.workoutId}-${log.date}-${index}`"
            class="flex items-center justify-between gap-3 py-3 text-sm"
          >
            <span class="font-medium text-slate-700">{{ log.name }}</span>
            <time class="shrink-0 text-xs text-slate-500" :datetime="log.date">{{ workoutData.formatDate(log.date) }}</time>
          </li>
        </ol>
      </div>
      </div>
    </section>
  </main>
</template>
