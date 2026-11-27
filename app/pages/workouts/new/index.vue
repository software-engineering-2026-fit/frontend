<script setup lang="ts">
import type { Exercise } from '../../../composables/useWorkoutApi'
import { messageFrom } from '../../../composables/useAuth'

const EXERCISES_PER_PAGE = 8

const api = useWorkoutApi()
const builder = useWorkoutBuilder()
const exercises = ref<Exercise[]>([])
const page = ref(1)
const hasNextPage = ref(false)
const searchQuery = ref('')
const errorMessage = ref<string | null>(null)
const createError = ref<string | null>(null)
const isSearching = ref(false)
const isCreatingExercise = ref(false)
const isSaving = ref(false)
const createdWorkoutId = ref<string | null>(null)
const showExerciseForm = ref(false)
const exerciseFormError = ref<string | null>(null)
const newExercise = reactive({
  name: '',
  description: '',
  muscleGroup: '',
  equipment: ''
})

useHead({ title: 'Create a workout | Fit' })

let searchVersion = 0

const firstVisibleExercise = computed(() => {
  return exercises.value.length ? (page.value - 1) * EXERCISES_PER_PAGE + 1 : 0
})
const lastVisibleExercise = computed(() => {
  return (page.value - 1) * EXERCISES_PER_PAGE + exercises.value.length
})

async function loadExercises(query = '', requestedPage = 1) {
  const version = ++searchVersion
  isSearching.value = true
  errorMessage.value = null
  try {
    const result = await api.searchExercises(
      query,
      EXERCISES_PER_PAGE + 1,
      (requestedPage - 1) * EXERCISES_PER_PAGE
    )
    if (version === searchVersion) {
      exercises.value = result.slice(0, EXERCISES_PER_PAGE)
      page.value = requestedPage
      hasNextPage.value = result.length > EXERCISES_PER_PAGE
    }
  } catch (error) {
    if (version === searchVersion) {
      errorMessage.value = messageFrom(error)
    }
  } finally {
    if (version === searchVersion) {
      isSearching.value = false
    }
  }
}

watch(searchQuery, (query, _, onCleanup) => {
  page.value = 1
  hasNextPage.value = false
  const timer = window.setTimeout(() => {
    void loadExercises(query, 1)
  }, 250)
  onCleanup(() => window.clearTimeout(timer))
})

onMounted(() => {
  void loadExercises()
})

function isSelected(exerciseId: string): boolean {
  return builder.exercises.value.some(item => item.exercise.id === exerciseId)
}

async function addCustomExercise() {
  exerciseFormError.value = null
  const name = newExercise.name.trim()
  if (!name) {
    exerciseFormError.value = 'Enter an exercise name.'
    return
  }

  isCreatingExercise.value = true
  try {
    const exercise = await api.createExercise({
      name,
      description: newExercise.description.trim() || null,
      muscle_group: newExercise.muscleGroup.trim() || null,
      equipment: newExercise.equipment.trim() || null
    })
    builder.toggleExercise(exercise)
    if (searchQuery.value === exercise.name) {
      void loadExercises(exercise.name, 1)
    } else {
      searchQuery.value = exercise.name
    }
    newExercise.name = ''
    newExercise.description = ''
    newExercise.muscleGroup = ''
    newExercise.equipment = ''
    showExerciseForm.value = false
  } catch (error) {
    exerciseFormError.value = messageFrom(error)
  } finally {
    isCreatingExercise.value = false
  }
}

async function createWorkout() {
  if (!builder.name.value.trim() || !builder.exercises.value.length || isSaving.value || createdWorkoutId.value) {
    return
  }

  createError.value = null
  isSaving.value = true
  const selectedExercises = [...builder.exercises.value]
  let savedExerciseCount = 0

  try {
    const workout = await api.createWorkout(builder.name.value)
    createdWorkoutId.value = workout.id

    for (const item of selectedExercises) {
      try {
        await api.addWorkoutExercise(
          workout.id,
          item.exercise.id,
          item.description?.trim() || null
        )
        savedExerciseCount += 1
      } catch (error) {
        createError.value = `The plan "${workout.name}" was created, but only ${savedExerciseCount} of ${selectedExercises.length} exercises were added. ${messageFrom(error)}`
        return
      }
    }

    builder.clear()
    await navigateTo(`/workouts/${workout.id}`)
  } catch (error) {
    createError.value = createdWorkoutId.value
      ? `The plan was created, but the request could not be completed. ${messageFrom(error)}`
      : messageFrom(error)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <main class="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
    <NuxtLink
      class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-violet-800"
      to="/workouts"
    >
      <span aria-hidden="true">←</span> Workout plans
    </NuxtLink>

    <header class="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Create workout</h1>
      </div>
    </header>

    <div class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section class="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
        <label for="workout-name" class="block text-sm font-semibold text-slate-800">Workout name</label>
        <input
          id="workout-name"
          v-model="builder.name.value"
          class="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          maxlength="100"
          placeholder="e.g. Upper body strength"
          required
        >

        <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Choose exercises</h2>
            <p class="mt-1 text-sm text-slate-500">Select the movements to include in this plan.</p>
          </div>
          <label class="relative block sm:w-64">
            <span class="sr-only">Search exercises by name, muscle group, or equipment</span>
            <svg class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5" />
              <path d="m13 13 4 4" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" />
            </svg>
            <input
              v-model="searchQuery"
              class="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              placeholder="Name, muscle group, equipment"
              type="search"
            >
          </label>
        </div>

        <p v-if="errorMessage" class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {{ errorMessage }}
        </p>

        <div v-if="isSearching" class="mt-5 rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500" aria-live="polite">
          Finding exercises…
        </div>
        <div
          v-else-if="!exercises.length && !errorMessage"
          class="mt-5 rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 px-4 py-8 text-center"
        >
          <p class="text-sm font-semibold text-slate-800">No exercises found</p>
          <p class="mt-1 text-sm text-slate-500">No matching exercises.</p>
        </div>
        <ul v-else class="mt-5 grid gap-2 sm:grid-cols-2" aria-label="Exercise catalog">
          <li v-for="exercise in exercises" :key="exercise.id">
            <button
              class="flex min-h-[76px] w-full items-center gap-3 rounded-2xl border p-3 text-left transition"
              :class="isSelected(exercise.id)
                ? 'border-violet-300 bg-violet-50 ring-1 ring-violet-200'
                : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/50'"
              type="button"
              :aria-pressed="isSelected(exercise.id)"
              @click="builder.toggleExercise(exercise)"
            >
              <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-800">
                <svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 9v6m12-6v6M3 10v4m18-4v4M6 12h12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" />
                </svg>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-slate-900">{{ exercise.name }}</span>
                <span class="mt-1 block truncate text-xs text-slate-500">
                  {{ [exercise.muscle_group, exercise.equipment].filter(Boolean).join(' · ') || exercise.description || 'Exercise' }}
                </span>
              </span>
              <span
                class="grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold"
                :class="isSelected(exercise.id)
                  ? 'border-violet-700 bg-violet-700 text-white'
                  : 'border-slate-300 text-transparent'"
                aria-hidden="true"
              >
                ✓
              </span>
            </button>
          </li>
        </ul>

        <div
          v-if="exercises.length"
          class="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-sm text-slate-500" aria-live="polite">
            Showing {{ firstVisibleExercise }}–{{ lastVisibleExercise }} · Page {{ page }}
          </p>
          <nav class="flex items-center justify-between gap-2" aria-label="Exercise pages">
            <button
              class="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              :disabled="page === 1 || isSearching"
              @click="loadExercises(searchQuery, page - 1)"
            >
              Previous
            </button>
            <button
              class="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              :disabled="!hasNextPage || isSearching"
              @click="loadExercises(searchQuery, page + 1)"
            >
              Next
            </button>
          </nav>
        </div>

        <button
          class="mt-5 text-sm font-semibold text-violet-800 hover:text-violet-950"
          type="button"
          :aria-expanded="showExerciseForm"
          @click="showExerciseForm = !showExerciseForm"
        >
          {{ showExerciseForm ? '− Cancel adding an exercise' : '+ Add a custom exercise' }}
        </button>
        <form
          v-if="showExerciseForm"
          class="mt-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-4"
          @submit.prevent="addCustomExercise"
        >
          <h3 class="text-sm font-bold text-slate-900">New exercise</h3>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="text-xs font-semibold text-slate-700 sm:col-span-2">
              Name
              <input
                v-model="newExercise.name"
                class="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                maxlength="100"
                required
              >
            </label>
            <label class="text-xs font-semibold text-slate-700">
              Muscle group
              <input
                v-model="newExercise.muscleGroup"
                class="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                maxlength="50"
              >
            </label>
            <label class="text-xs font-semibold text-slate-700">
              Equipment
              <input
                v-model="newExercise.equipment"
                class="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                maxlength="50"
              >
            </label>
            <label class="text-xs font-semibold text-slate-700 sm:col-span-2">
              Description
              <textarea
                v-model="newExercise.description"
                class="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                rows="2"
              />
            </label>
          </div>
          <p v-if="exerciseFormError" class="mt-3 text-sm text-rose-700" role="alert">{{ exerciseFormError }}</p>
          <button
            class="mt-3 min-h-10 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60"
            type="submit"
            :disabled="isCreatingExercise"
          >
            {{ isCreatingExercise ? 'Adding…' : 'Add and select exercise' }}
          </button>
        </form>
      </section>

      <aside class="h-fit rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-bold text-slate-900">Selected exercises</h2>
          <span class="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-800">
            {{ builder.exercises.value.length }}
          </span>
        </div>
        <p v-if="!builder.exercises.value.length" class="mt-4 rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
          No exercises selected.
        </p>
        <ol v-else class="mt-4 space-y-2 ">
          <li
            v-for="(item, index) in builder.exercises.value"
            :key="item.exercise.id"
            class="flex flex-col items-center gap-3 rounded-xl bg-violet-50/70 px-3 py-2.5"
          >
            <div class="flex gap-3 items-center">
            <span class="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-xs font-bold text-violet-800">{{ index + 1 }}</span>
            <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{{ item.exercise.name }}</span>
            <button
              class="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
              type="button"
              :aria-label="`Remove ${item.exercise.name}`"
              @click="builder.toggleExercise(item.exercise)"
            >
              ×
            </button>
            </div>
              <textarea
                v-model="item.description"
                class="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                rows="2"
              />
          </li>
        </ol>
        <p v-if="createError" class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {{ createError }}
          <NuxtLink
            v-if="createdWorkoutId"
            class="ml-1 font-semibold underline"
            :to="`/workouts/${createdWorkoutId}`"
          >
            View created plan
          </NuxtLink>
        </p>
        <button
          class="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          :disabled="!builder.name.value.trim() || !builder.exercises.value.length || isSaving || Boolean(createdWorkoutId)"
          @click="createWorkout"
        >
          {{ isSaving ? 'Creating workout…' : 'Create workout' }}
          <span v-if="!isSaving" aria-hidden="true">→</span>
        </button>
        <p v-if="builder.name.value.trim() && !builder.exercises.value.length" class="mt-2 text-center text-xs text-slate-500">
          Choose at least one exercise.
        </p>
        <p v-else-if="!builder.name.value.trim()" class="mt-2 text-center text-xs text-slate-500">
          Enter a workout name to continue.
        </p>
      </aside>
    </div>
  </main>
</template>
