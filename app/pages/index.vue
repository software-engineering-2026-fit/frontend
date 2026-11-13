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
  <main class="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
    <section class="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-violet-800 via-violet-700 to-fuchsia-700 px-6 py-8 text-white shadow-xl shadow-violet-900/15 sm:px-10 sm:py-12">
      <div class="absolute -right-10 -top-20 -z-10 size-64 rounded-full bg-white/10 blur-2xl" />
      <div class="absolute -bottom-28 right-1/4 -z-10 size-56 rounded-full bg-fuchsia-300/20 blur-3xl" />
      <p class="mb-3 text-xs font-bold tracking-[0.2em] text-violet-200">YOUR TRAINING, IN FOCUS</p>
      <h1 class="max-w-xl text-3xl font-bold tracking-tight sm:text-5xl">
        Hi, {{ greetingName }}. <span class="text-fuchsia-200">Ready to move?</span>
      </h1>
      <p class="mt-3 max-w-lg text-sm leading-6 text-violet-100 sm:text-base">
        Every session counts. Pick a plan and keep showing up for yourself.
      </p>
      <NuxtLink
        class="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-violet-800 shadow-md transition hover:-translate-y-0.5 hover:bg-violet-50"
        to="/workouts"
      >
        Explore workout plans
        <svg class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" />
        </svg>
      </NuxtLink>
    </section>

    <section class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-slate-500">Workout plans</p>
            <p class="mt-2 text-4xl font-bold tracking-tight text-slate-900">
              {{ workoutData.workouts.value.length }}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              {{ workoutData.workouts.value.length === 1 ? 'plan ready when you are' : 'plans ready when you are' }}
            </p>
          </div>
          <span class="grid size-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 9v6m12-6v6M3 10v4m18-4v4M6 12h12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
            </svg>
          </span>
        </div>
      </div>

      <div class="rounded-2xl border border-fuchsia-100 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-slate-500">Sessions logged</p>
            <p class="mt-2 text-4xl font-bold tracking-tight text-slate-900">
              {{ workoutData.workoutLogs.value.length }}
            </p>
            <p class="mt-1 text-xs text-slate-500">Synced with the API</p>
          </div>
          <span class="grid size-11 place-items-center rounded-2xl bg-fuchsia-100 text-fuchsia-700">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m5 12 4 4L19 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
            </svg>
          </span>
        </div>
      </div>

      <div class="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-slate-500">Active sessions</p>
            <p class="mt-2 text-4xl font-bold tracking-tight text-slate-900">
              {{ workoutData.activeSessions.value.length }}
            </p>
            <p class="mt-1 text-xs text-slate-500">In progress</p>
          </div>
          <span class="grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8" />
              <path d="M12 7v5l3 2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
            </svg>
          </span>
        </div>
      </div>

      <p v-if="workoutData.errorMessage.value" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:col-span-2 lg:col-span-3" role="alert">
        {{ workoutData.errorMessage.value }}
      </p>
    </section>

    <section class="mt-8" aria-labelledby="active-sessions-heading">
      <div class="mb-4 flex items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold tracking-[0.18em] text-violet-700">CURRENTLY IN PROGRESS</p>
          <h2 id="active-sessions-heading" class="mt-1 text-xl font-bold text-slate-900">Active sessions</h2>
        </div>
        <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          {{ workoutData.activeSessions.value.length }}
          {{ workoutData.activeSessions.value.length === 1 ? 'session' : 'sessions' }}
        </span>
      </div>

      <p
        v-if="workoutData.isLoadingLogs.value && !workoutData.activeSessions.value.length"
        class="rounded-2xl border border-violet-100 bg-white px-5 py-8 text-center text-sm text-slate-500"
        aria-live="polite"
      >
        Loading active sessions…
      </p>
      <p
        v-else-if="!workoutData.activeSessions.value.length"
        class="rounded-2xl border border-dashed border-violet-200 bg-white/70 px-5 py-8 text-center text-sm text-slate-500"
      >
        No active sessions right now.
      </p>
      <ul v-else class="grid gap-3">
        <li
          v-for="session in workoutData.activeSessions.value"
          :key="session.id"
          class="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <h3 class="truncate text-lg font-bold text-slate-900">{{ session.name }}</h3>
              <p class="mt-1 text-sm text-slate-500">
                Started {{ workoutData.formatDate(session.date) }}
                · {{ session.exercises.length }}
                {{ session.exercises.length === 1 ? 'exercise recorded' : 'exercises recorded' }}
              </p>
              <ul v-if="session.exercises.length" class="mt-3 flex flex-wrap gap-2">
                <li
                  v-for="(exercise, index) in session.exercises"
                  :key="`${session.id}-${exercise.exerciseId}-${index}`"
                  class="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-900"
                >
                  {{ exercise.exerciseName }}
                  <span v-if="exercise.reps !== null"> · {{ exercise.reps }} reps</span>
                </li>
              </ul>
              <p v-else class="mt-3 text-sm text-slate-500">No exercises recorded yet.</p>
            </div>
            <NuxtLink
              class="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-violet-200 px-4 text-sm font-semibold text-violet-800 transition hover:bg-violet-50"
              :to="`/workouts/${session.workoutId}/log?sessionId=${session.id}`"
            >
              Continue logging
            </NuxtLink>
          </div>
        </li>
      </ul>
    </section>
  </main>
</template>
