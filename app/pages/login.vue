<script setup lang="ts">
const auth = useAuth()
const mode = ref<'login' | 'register'>('login')
const name = ref('')
const email = ref('')
const password = ref('')

const isSubmitting = computed(() => auth.isSigningIn.value || auth.isRegistering.value)

useHead(() => ({
  title: mode.value === 'login' ? 'Sign in | Fit' : 'Create account | Fit'
}))

async function submitLogin() {
  const signedIn = await auth.signIn(email.value, password.value)
  if (signedIn) {
    await navigateTo('/workouts')
  }
}

async function submitRegistration() {
  const registered = await auth.register(name.value, email.value, password.value)
  if (registered) {
    await navigateTo('/workouts')
  }
}

function setMode(nextMode: 'login' | 'register') {
  mode.value = nextMode
  auth.errorMessage.value = null
}
</script>

<template>
  <main class="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
    <section class="hidden md:block">
      <p class="mb-3 text-xs font-bold tracking-[0.2em] text-violet-700">WELCOME TO FIT</p>
      <h1 class="max-w-lg text-5xl font-bold leading-tight tracking-tight text-slate-950">
        Make room for a <span class="text-violet-700">stronger you.</span>
      </h1>
      <p class="mt-4 max-w-md text-base leading-7 text-slate-600">
        Your plans, your pace, your progress. Sign in and get back to it.
      </p>
      <div class="mt-8 flex items-center gap-3 text-sm font-medium text-slate-600">
        <span class="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-700">
          <svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9v6m12-6v6M3 10v4m18-4v4M6 12h12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
          </svg>
        </span>
        A little progress adds up.
      </div>
    </section>

    <section class="mx-auto w-full max-w-md rounded-3xl border border-violet-100 bg-white p-6 shadow-[0_24px_70px_-35px_rgba(91,33,182,0.35)] sm:p-9" aria-labelledby="login-title">
      <span class="mb-6 grid size-12 place-items-center rounded-2xl bg-violet-700 text-lg font-bold text-white shadow-lg shadow-violet-700/20">F</span>
      <p class="mb-2 text-xs font-bold tracking-[0.16em] text-violet-700">YOUR TRAINING, IN FOCUS</p>
      <h2 id="login-title" class="text-2xl font-bold tracking-tight text-slate-950">
        {{ mode === 'login' ? 'Welcome back' : 'Create your account' }}
      </h2>
      <p class="mt-2 mb-7 text-sm leading-6 text-slate-500">
        {{ mode === 'login' ? 'Sign in to see and log your workout plans.' : 'Join Fit and start building your workout routine.' }}
      </p>

      <form v-if="mode === 'register'" class="grid" @submit.prevent="submitRegistration">
        <label class="mb-2 text-sm font-semibold text-slate-700" for="name">Name</label>
        <input
          id="name"
          v-model="name"
          class="mb-5 h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
          type="text"
          name="name"
          autocomplete="name"
          placeholder="Your name"
          required
          :disabled="isSubmitting"
        >
        <label class="mb-2 text-sm font-semibold text-slate-700" for="email">Email address</label>
        <input
          id="email"
          v-model="email"
          class="mb-5 h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
          type="email"
          name="email"
          autocomplete="username"
          placeholder="you@example.com"
          required
          :disabled="isSubmitting"
        >
        <label class="mb-2 text-sm font-semibold text-slate-700" for="password">Password</label>
        <input
          id="password"
          v-model="password"
          class="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
          type="password"
          name="password"
          autocomplete="current-password"
          :placeholder="mode === 'register' ? 'Create a password' : 'Enter your password'"
          required
          :disabled="isSubmitting"
        >
        <p v-if="auth.errorMessage.value" class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800" role="alert">
          {{ auth.errorMessage.value }}
        </p>
        <button
          class="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white shadow-md shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60"
          type="submit"
          :disabled="isSubmitting"
        >
          {{ auth.isRegistering.value ? 'Creating account…' : auth.isSigningIn.value ? 'Signing in…' : 'Create account' }}
          <svg v-if="!isSubmitting" class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" />
          </svg>
        </button>
      </form>

      <form v-else class="grid" @submit.prevent="submitLogin">
        <label class="mb-2 text-sm font-semibold text-slate-700" for="email">Email address</label>
        <input
          id="email"
          v-model="email"
          class="mb-5 h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
          type="email"
          name="email"
          autocomplete="username"
          placeholder="you@example.com"
          required
          :disabled="isSubmitting"
        >
        <label class="mb-2 text-sm font-semibold text-slate-700" for="password">Password</label>
        <input
          id="password"
          v-model="password"
          class="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
          type="password"
          name="password"
          autocomplete="current-password"
          placeholder="Enter your password"
          required
          :disabled="isSubmitting"
        >
        <p v-if="auth.errorMessage.value" class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800" role="alert">
          {{ auth.errorMessage.value }}
        </p>
        <button
          class="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white shadow-md shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60"
          type="submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
          <svg v-if="!isSubmitting" class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" />
          </svg>
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">
        {{ mode === 'login' ? 'New to Fit?' : 'Already have an account?' }}
        <button
          class="ml-1 font-semibold text-violet-700 underline-offset-4 hover:text-violet-900 hover:underline"
          type="button"
          @click="setMode(mode === 'login' ? 'register' : 'login')"
        >
          {{ mode === 'login' ? 'Create an account' : 'Sign in' }}
        </button>
      </p>
    </section>
  </main>
</template>
