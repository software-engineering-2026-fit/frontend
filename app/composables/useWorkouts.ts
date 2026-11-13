import { messageFrom } from './useAuth'
import { useWorkoutApi } from './useWorkoutApi'
import type { WorkoutSession } from './useWorkoutApi'

export interface Workout {
  id: string
  name: string
  description: string | null
  public: boolean
}

export interface WorkoutLogExercise {
  exerciseId: string
  exerciseName: string
  weight: number | null
  reps: number | null
  exhaustionLevel: number | null
}

export interface WorkoutLog {
  id: string
  workoutId: string
  name: string
  date: string
  exercises: WorkoutLogExercise[]
}

function todayAsInputValue(): string {
  const date = new Date()
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function dateForApi(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12).toISOString()
}

function dateForInput(value: string): string {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toWorkoutLog(
  session: WorkoutSession
): WorkoutLog {
  return {
    id: session.id,
    workoutId: session.workout_id,
    name: session.workout_name,
    date: dateForInput(session.date),
    exercises: session.logs.map(log => ({
      exerciseId: log.exercise_id,
      exerciseName: log.exercise_name,
      weight: log.weight,
      reps: log.reps,
      exhaustionLevel: log.exhaustion_level
    }))
  }
}

export function useWorkouts() {
  const api = useWorkoutApi()
  const workouts = useState<Workout[]>('workouts', () => [])
  const workoutLogs = useState<WorkoutLog[]>('workout-logs', () => [])
  const activeSessions = useState<WorkoutLog[]>('active-workout-sessions', () => [])
  const isLoading = useState('workouts-loading', () => false)
  const isLoadingLogs = useState('workout-logs-loading', () => false)
  const errorMessage = useState<string | null>('workouts-error', () => null)
  const successMessage = useState<string | null>('workouts-success', () => null)
  const logDate = useState('workout-log-date', todayAsInputValue)
  const pendingLogDate = useState<string | null>('pending-workout-log-date', () => null)

  async function loadWorkouts() {
    isLoading.value = true
    errorMessage.value = null

    try {
      workouts.value = await api.getWorkouts()
    } catch (error) {
      errorMessage.value = messageFrom(error)
    } finally {
      isLoading.value = false
    }
  }

  async function loadWorkoutLogs() {
    isLoadingLogs.value = true
    errorMessage.value = null

    try {
      const sessions = await api.getWorkoutSessions()
      const completedSessions = sessions.filter(session => session.ended_at !== null)
      const inProgressSessions = sessions.filter(session => session.ended_at === null)
      const logs = completedSessions.map(toWorkoutLog)
      const active = inProgressSessions.map(toWorkoutLog)
      workoutLogs.value = logs.sort((a, b) => b.date.localeCompare(a.date))
      activeSessions.value = active.sort((a, b) => b.date.localeCompare(a.date))
    } catch (error) {
      errorMessage.value = messageFrom(error)
    } finally {
      isLoadingLogs.value = false
    }
  }

  function lastLogFor(workoutId: string): WorkoutLog | undefined {
    return workoutLogs.value
      .filter(log => log.workoutId === workoutId)
      .sort((a, b) => b.date.localeCompare(a.date))[0]
  }

  function formatDate(value: string): string {
    const date = new Date(`${value.slice(0, 10)}T00:00:00`)
    const parts = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'numeric',
      year: '2-digit'
    }).formatToParts(date)
    const part = (type: string) => parts.find(item => item.type === type)?.value ?? ''
    return `${part('day')}/${part('month')}-${part('year')}`
  }

  async function logWorkout(
    workout: Workout,
    exercises: WorkoutLogExercise[]
  ): Promise<boolean> {
    let sessionId: string | null = null
    try {
      const session = await api.createWorkoutSession(
        workout.id,
        dateForApi(logDate.value || todayAsInputValue())
      )
      sessionId = session.id

      for (const exercise of exercises) {
        await api.addWorkoutSessionLog(session.id, {
          exercise_id: exercise.exerciseId,
          weight: exercise.weight,
          reps: exercise.reps,
          exhaustion_level: exercise.exhaustionLevel
        })
      }

      const completedSession = await api.endWorkoutSession(session.id)
      const newLog = toWorkoutLog(completedSession)
      workoutLogs.value = [
        newLog,
        ...workoutLogs.value.filter(item => item.id !== newLog.id)
      ].sort((a, b) => b.date.localeCompare(a.date))
      successMessage.value = `${workout.name} logged for ${formatDate(newLog.date)}.`
      errorMessage.value = null
      return true
    } catch (error) {
      errorMessage.value = sessionId
        ? `The workout session was started but could not be fully saved or completed. ${messageFrom(error)}`
        : `Could not save this workout to the API. ${messageFrom(error)}`
      successMessage.value = null
      return false
    }
  }

  const sortedWorkouts = computed(() => {
    return [...workouts.value].sort((a, b) => {
      const aDate = lastLogFor(a.id)?.date ?? ''
      const bDate = lastLogFor(b.id)?.date ?? ''
      return bDate.localeCompare(aDate) || a.name.localeCompare(b.name)
    })
  })

  const workoutHistory = computed(() => workoutLogs.value.slice(0, 5))

  return {
    workouts,
    workoutLogs,
    activeSessions,
    isLoading,
    isLoadingLogs,
    errorMessage,
    successMessage,
    logDate,
    pendingLogDate,
    sortedWorkouts,
    workoutHistory,
    loadWorkouts,
    loadWorkoutLogs,
    lastLogFor,
    formatDate,
    logWorkout
  }
}
