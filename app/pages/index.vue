<script setup lang="ts">
const auth = useAuth()
const workoutData = useWorkouts()

useHead({ title: 'Home | Fit' })

const greetingName = computed(() => auth.user.value?.name.split(' ')[0] ?? 'there')

onMounted(() => {
  void workoutData.loadWorkouts()
  void workoutData.loadWorkoutLogs()
})
</script>

<template>
  <main class="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <header class="border-b border-slate-200 pb-5">
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Dashboard</p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
        Hi, {{ greetingName }}
      </h1>
      <NuxtLink
        class="mt-4 inline-flex min-h-10 items-center rounded-sm bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800"
        to="/workouts"
      >
        View workout plans
      </NuxtLink>
    </header>

    <section class="grid grid-cols-3 border-b border-slate-200" aria-label="Workout summary">
      <article class="border-r border-slate-200 py-5 pr-4 last:border-r-0 sm:px-6">
        <p class="text-sm text-slate-600">Workout plans</p>
        <p class="mt-1 text-3xl font-bold text-slate-950">{{ workoutData.workouts.value.length }}</p>
      </article>
      <article class="border-r border-slate-200 px-4 py-5 last:border-r-0 sm:px-6">
        <p class="text-sm text-slate-600">Sessions logged</p>
        <p class="mt-1 text-3xl font-bold text-slate-950">{{ workoutData.workoutLogs.value.length }}</p>
      </article>
      <article class="py-5 pl-4 sm:px-6">
        <p class="text-sm text-slate-600">Active sessions</p>
        <p class="mt-1 text-3xl font-bold text-slate-950">{{ workoutData.activeSessions.value.length }}</p>
      </article>
      <p v-if="workoutData.errorMessage.value" class="col-span-3 border-t border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
        {{ workoutData.errorMessage.value }}
      </p>
    </section>

    <section class="mt-6" aria-labelledby="active-sessions-heading">
      <h2 id="active-sessions-heading" class="text-lg font-bold text-slate-950">
        Active sessions
        <span class="ml-1 text-sm font-normal text-slate-500">({{ workoutData.activeSessions.value.length }})</span>
      </h2>

      <p
        v-if="workoutData.isLoadingLogs.value && !workoutData.activeSessions.value.length"
        class="mt-3 border-y border-slate-200 py-6 text-sm text-slate-500"
        aria-live="polite"
      >
        Loading active sessions…
      </p>
      <p
        v-else-if="!workoutData.activeSessions.value.length"
        class="mt-3 border-y border-slate-200 py-6 text-sm text-slate-500"
      >
        No active sessions right now.
      </p>
      <ul v-else class="mt-2 divide-y divide-slate-200 border-y border-slate-200">
        <li
          v-for="session in workoutData.activeSessions.value"
          :key="session.id"
          class="py-4"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <h3 class="truncate text-base font-bold text-slate-950">{{ session.name }}</h3>
              <p class="mt-1 text-sm text-slate-500">
                Started {{ workoutData.formatDate(session.date) }}
                · {{ session.exercises.length }}
                {{ session.exercises.length === 1 ? 'exercise recorded' : 'exercises recorded' }}
              </p>
              <ul v-if="session.exercises.length" class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <li
                  v-for="(exercise, index) in session.exercises"
                  :key="`${session.id}-${exercise.exerciseId}-${index}`"
                  class="text-sm text-slate-700"
                >
                  {{ exercise.exerciseName }}
                  <span v-if="exercise.reps !== null" class="text-slate-500"> — {{ exercise.reps }} reps</span>
                </li>
              </ul>
              <p v-else class="mt-3 text-sm text-slate-500">No exercises recorded yet.</p>
            </div>
            <NuxtLink
              class="inline-flex min-h-10 shrink-0 items-center justify-center border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:border-slate-500 hover:bg-slate-50"
              :to="`/workouts/${session.workoutId}/log?sessionId=${session.id}`"
            >
              Log session
            </NuxtLink>
          </div>
        </li>
      </ul>
    </section>
  </main>
</template>
