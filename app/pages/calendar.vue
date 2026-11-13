<script setup lang="ts">
const workoutData = useWorkouts()
const visibleMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

useHead({ title: 'Workout history | Fit' })

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftMonth(amount: number) {
  visibleMonth.value = new Date(
    visibleMonth.value.getFullYear(),
    visibleMonth.value.getMonth() + amount,
    1
  )
}

function goToToday() {
  const today = new Date()
  visibleMonth.value = new Date(today.getFullYear(), today.getMonth(), 1)
}

function selectDate(date: Date) {
  const selectedDate = dateKey(date)
  workoutData.logDate.value = selectedDate
  workoutData.pendingLogDate.value = selectedDate
  navigateTo('/workouts')
}

const monthTitle = computed(() => new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric'
}).format(visibleMonth.value))

const currentMonthKey = computed(() => {
  const year = visibleMonth.value.getFullYear()
  const month = String(visibleMonth.value.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
})

const currentMonthCount = computed(() => workoutData.workoutLogs.value
  .filter(log => log.date.startsWith(currentMonthKey.value))
  .length)

const calendarDays = computed(() => {
  const year = visibleMonth.value.getFullYear()
  const month = visibleMonth.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()
  const slotCount = Math.ceil((mondayOffset + totalDays) / 7) * 7
  const today = dateKey(new Date())

  return Array.from({ length: slotCount }, (_, index) => {
    const date = new Date(year, month, index - mondayOffset + 1)
    const key = dateKey(date)

    return {
      date,
      key,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: key === today,
      logs: workoutData.workoutLogs.value.filter(log => log.date === key)
    }
  })
})

onMounted(() => {
  void workoutData.loadWorkoutLogs()
})
</script>

<template>
  <main class="mx-auto w-full max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-10 lg:px-8">
    <header class="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="mb-2 text-xs font-bold tracking-[0.18em] text-violet-700">YOUR PROGRESS, AT A GLANCE</p>
        <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Workout history</h1>
        <p class="mt-2 text-sm text-slate-500">Your previous workouts, all in one place.</p>
      </div>
      <div class="inline-flex w-fit items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2 text-sm shadow-sm">
        <span class="size-2 rounded-full bg-fuchsia-500" aria-hidden="true" />
        <span class="font-semibold text-slate-900">{{ currentMonthCount }}</span>
        <span class="text-slate-500">workouts this month</span>
      </div>
    </header>

    <section class="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_20px_60px_-35px_rgba(91,33,182,0.3)]" aria-label="Workout history calendar">
      <div class="flex flex-col gap-4 border-b border-violet-100 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 class="text-lg font-bold text-slate-900">{{ monthTitle }}</h2>
          <p class="mt-0.5 text-xs text-slate-500">Select a day to log a workout</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
            type="button"
            @click="goToToday"
          >
            Today
          </button>
          <button
            class="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
            type="button"
            aria-label="Previous month"
            @click="shiftMonth(-1)"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m12 4-6 6 6 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" />
            </svg>
          </button>
          <button
            class="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
            type="button"
            aria-label="Next month"
            @click="shiftMonth(1)"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m8 4 6 6-6 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" />
            </svg>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
        <div
          v-for="weekday in weekdays"
          :key="weekday"
          class="px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:px-3 sm:py-3 sm:text-xs"
        >
          <span class="sm:hidden">{{ weekday.slice(0, 3) }}</span>
          <span class="hidden sm:inline">{{ weekday }}</span>
        </div>
      </div>

      <div class="grid grid-cols-7">
        <button
          v-for="day in calendarDays"
          :key="day.key"
          class="group flex min-h-20 min-w-0 flex-col items-stretch gap-1 border-b border-r border-slate-100 p-1.5 text-left transition hover:bg-violet-50/70 sm:min-h-28 sm:gap-1.5 sm:p-2.5"
          :class="[
            day.isCurrentMonth ? 'bg-white' : 'bg-slate-50/70 text-slate-400',
            day.isToday ? 'ring-2 ring-inset ring-violet-400' : ''
          ]"
          type="button"
          :aria-label="`${day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${day.logs.length ? `, ${day.logs.length} workout${day.logs.length === 1 ? '' : 's'}` : ''}. Click to log a workout.`"
          @click="selectDate(day.date)"
        >
          <span
            class="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-medium sm:size-7 sm:text-xs"
            :class="day.isToday ? 'bg-violet-700 font-bold text-white' : day.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'"
          >
            {{ day.dayNumber }}
          </span>
          <span
            v-for="(log, index) in day.logs.slice(0, 3)"
            :key="`${log.workoutId}-${index}`"
            class="block truncate rounded-md bg-fuchsia-100 px-1.5 py-1 text-[9px] font-medium leading-tight text-fuchsia-900 ring-1 ring-inset ring-fuchsia-200 sm:px-2 sm:text-[11px]"
            :class="day.isCurrentMonth ? '' : 'opacity-55'"
            :title="log.name"
          >
            {{ log.name }}
          </span>
          <span v-if="day.logs.length > 3" class="px-1 text-[9px] font-medium text-violet-700">
            +{{ day.logs.length - 3 }} more
          </span>
        </button>
      </div>

      <footer class="flex flex-col gap-2 bg-white px-4 py-3 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span class="inline-flex items-center gap-2">
          <span class="size-2 rounded-full bg-fuchsia-500" aria-hidden="true" />
          Logged workout
        </span>
        <span>Workout history is synced with the API · Select a date to log</span>
      </footer>
    </section>

    <p v-if="workoutData.errorMessage.value" class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
      {{ workoutData.errorMessage.value }}
    </p>
    <p v-if="!workoutData.workoutLogs.value.length" class="mt-4 text-center text-xs text-slate-500">
      No workouts logged yet. Select any day to choose a plan and record your first session.
    </p>
  </main>
</template>
