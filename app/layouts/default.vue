<script setup lang="ts">
const auth = useAuth()

async function signOut() {
  auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-rose-50 via-white to-violet-50 text-slate-900">
    <header class="sticky top-0 z-20 border-b border-violet-100 bg-white/90 shadow-sm backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <nav class="flex h-full items-center gap-1" aria-label="Main navigation">
          <NuxtLink
            class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-800"
            active-class="!bg-violet-100 !text-violet-900"
            to="/"
          >
            Home
          </NuxtLink>
          <NuxtLink
            class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-800"
            active-class="!bg-violet-100 !text-violet-900"
            to="/workouts"
          >
            Workout plans
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <NuxtLink
            v-if="auth.user.value"
            class="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
            active-class="!border-violet-300 !bg-violet-100 !text-violet-800"
            to="/calendar"
            aria-label="Workout calendar"
          >
              <svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="6" width="16" height="14" rx="2" />
                <path d="M8 4v4M16 4v4M4 10h16M9 14h2v2H9z" />
              </svg>
          </NuxtLink>

          <template v-if="auth.user.value">
            <NuxtLink
              class="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-800 sm:inline-flex"
              to="/account"
            >
              Account
            </NuxtLink>
            <button
              class="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
              type="button"
              @click="signOut"
            >
              <svg class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M8 3H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17H8m4-3 4-4-4-4m4 4H7" />
              </svg>
              <span>Sign out</span>
            </button>
          </template>
          <NuxtLink
            v-else
            class="inline-flex min-h-10 items-center justify-center rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800"
            to="/login"
          >
            Sign in
          </NuxtLink>
        </div>
      </div>
    </header>

    <NuxtPage />
  </div>
</template>
