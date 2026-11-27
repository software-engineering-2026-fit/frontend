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
      <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Account</h1>
    </header>

    <section class="max-w-2xl border border-violet-100 bg-white">
      <div class="flex items-center gap-4 border-b border-slate-100 bg-violet-50 p-5 sm:p-7">
        <span class="grid size-14 shrink-0 place-items-center rounded-sm bg-violet-700 text-xl font-bold text-white">
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
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            type="button"
            @click="signOut"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" aria-hidden="true">
              <path d="M8 3H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17H8m4-3 4-4-4-4m4 4H7" />
            </svg>
            <span>Sign out</span>
          </button>

          <button
            v-if="!editMode"
            class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-violet-300 bg-violet-50 px-4 text-sm font-semibold text-violet-800 hover:bg-violet-100 sm:w-auto"
            type="button"
            @click="editMode=true"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" />
            </svg>
            <span>Edit profile</span>
          </button>
          <template v-else>
            <button
              class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-violet-700 bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 sm:w-auto"
              type="button"
              @click="saveChanges()"
            >
              <span>Save</span>
            </button>
            <button
              class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
              type="button"
              @click="editMode=false"
            >
              <span>Cancel</span>
            </button>
          </template>
        </div>
      </div>
    </section>
  </main>
</template>
