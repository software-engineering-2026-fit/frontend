<script setup lang="ts">
const auth = useAuth()

async function signOut() {
  auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900">
    <header class="sticky top-0 z-20 border-b border-slate-300 bg-white">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <nav class="flex h-full items-center gap-1" aria-label="Main navigation">
          <NuxtLink
            class="inline-flex h-full items-center border-b-2 border-transparent px-3 text-sm font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-950"
            active-class="!border-violet-700 !text-slate-950"
            to="/"
          >
            Home
          </NuxtLink>
          <NuxtLink
            class="inline-flex h-full items-center border-b-2 border-transparent px-3 text-sm font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-950"
            active-class="!border-violet-700 !text-slate-950"
            to="/workouts"
          >
            Workout plans
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <NuxtLink
            v-if="auth.user.value"
            class="grid size-9 shrink-0 place-items-center text-slate-700 hover:bg-violet-50 hover:text-violet-800"
            active-class="!text-violet-800"
            to="/calendar"
            aria-label="Workout calendar"
          >
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="4" y="6" width="16" height="14" rx="2" />
                <path d="M8 4v4M16 4v4M4 10h16M9 14h2v2H9z" />
              </svg>
          </NuxtLink>

          <template v-if="auth.user.value">
            <NuxtLink
              class="hidden h-9 items-center px-3 text-sm font-semibold text-slate-600 hover:text-slate-950 hover:underline sm:inline-flex"
              to="/account"
            >
              Account
            </NuxtLink>
            <button
              class="inline-flex h-9 shrink-0 items-center justify-center gap-2 px-2 text-sm font-semibold text-slate-700 hover:text-slate-950"
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
            class="inline-flex min-h-9 items-center justify-center bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800"
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
