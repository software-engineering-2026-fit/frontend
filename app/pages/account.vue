<script setup lang="ts">
const auth = useAuth()

useHead({ title: 'Account | Fit' })

async function signOut() {
  auth.signOut()
  await navigateTo('/login')
}

let editMode = ref(false)

async function saveChanges() {
    
  try {
    await auth.editUserProfile(auth.user.value?.name)
  } catch (error) {
    console.error('Error saving changes:', error)
  } finally {
    editMode.value = false
  }
}

</script>

<template>
  <main class="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
    <header class="mb-7">
      <p class="mb-2 text-xs font-bold tracking-[0.18em] text-violet-700">YOUR FIT PROFILE</p>
      <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Account</h1>
      <p class="mt-2 text-sm text-slate-600">Manage your profile and session.</p>
    </header>

    <section class="max-w-2xl overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_20px_60px_-35px_rgba(91,33,182,0.3)]">
      <div class="flex items-center gap-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-5 sm:p-7">
        <span class="grid size-14 shrink-0 place-items-center rounded-2xl bg-violet-700 text-xl font-bold text-white shadow-md shadow-violet-700/20">
          {{ auth.user.value?.name.slice(0, 1).toUpperCase() }}
        </span>
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wider text-violet-700">Profile</p>
          <h2 v-if="!editMode" class="mt-1 truncate text-xl font-bold text-slate-900">{{ auth.user.value?.name }}</h2>
          <input
            v-else
            v-model="auth.user.value.name"
            type="text"
            class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-base"
          />
          <p class="mt-0.5 truncate text-sm text-slate-500">{{ auth.user.value?.email }}</p>
        </div>
      </div>

      <div class="p-5 sm:p-7">
        <div class="mb-5">
          <h3 class="text-sm font-semibold text-slate-900">Session</h3>
          <p class="mt-1 text-sm leading-5 text-slate-500">
            Sign out to end your current session on this browser.
          </p>
        </div>
        <button
          class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 sm:w-auto"
          type="button"
          @click="signOut"
        >

      

          <svg class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M8 3H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17H8m4-3 4-4-4-4m4 4H7" />
          </svg>
          <span>Sign out of Fit</span>
        </button>

        <button 
          v-if="!editMode"
          class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:w-auto"
          type="button"
          @click="editMode=true"
        >
          <svg class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" />
          </svg>
          <span>Edit Profile</span>
        </button>
        <div v-else class="flex gap-4">
          <button
            class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 text-sm font-semibold text-green-700 transition hover:border-green-300 hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 sm:w-auto"
            type="button"
            @click="saveChanges()"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" />
            </svg>
            <span>Save Changes</span>
          </button>
          <button
            class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 sm:w-auto"
            type="button"
            @click="editMode=false"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" />
            </svg>
            <span>Cancel Changes</span>
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
