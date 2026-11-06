import { messageFrom } from './useAuth'
import { useWorkoutApi } from './useWorkoutApi'

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
  sets: number
  reps: number
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

export function useWorkouts() {
  const api = useWorkoutApi()
  const workouts = useState<Workout[]>('workouts', () => [])
  const workoutLogs = useState<WorkoutLog[]>('workout-logs', () => [])
  const isLoading = useState('workouts-loading', () => false)
  const isLoadingLogs = useState('workout-logs-loading', () => false)
  const errorMessage = useState<string | null>('workouts-error', () => null)
  const successMessage = useState<string | null>('workouts-success', () => null)
  const logDate = useState('workout-log-date', todayAsInputValue)

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
      workoutLogs.value = (await api.getWorkoutLogs()).map(log => ({
        id: log.id,
        workoutId: log.workout_id,
        name: log.workout_name,
        date: log.performed_on,
        exercises: log.exercises.map(exercise => ({
          exerciseId: exercise.exercise.id,
          exerciseName: exercise.exercise.name,
          weight: exercise.weight_kg,
          sets: exercise.sets,
          reps: exercise.reps,
          exhaustionLevel: exercise.exhaustion_level
        }))
      }))
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
    const date = new Date(`${value}T00:00:00`)
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
    try {
      const log = await api.createWorkoutLog({
        workout_id: workout.id,
        performed_on: logDate.value || todayAsInputValue(),
        exercises: exercises.map(exercise => ({
          exercise_id: exercise.exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
          weight_kg: exercise.weight,
          exhaustion_level: exercise.exhaustionLevel
        }))
      })
      workoutLogs.value = [
        {
          id: log.id,
          workoutId: log.workout_id,
          name: log.workout_name,
          date: log.performed_on,
          exercises: log.exercises.map(exercise => ({
            exerciseId: exercise.exercise.id,
            exerciseName: exercise.exercise.name,
            weight: exercise.weight_kg,
            sets: exercise.sets,
            reps: exercise.reps,
            exhaustionLevel: exercise.exhaustion_level
          }))
        },
        ...workoutLogs.value.filter(item => item.id !== log.id)
      ].sort((a, b) => b.date.localeCompare(a.date))
      successMessage.value = `${workout.name} logged for ${formatDate(log.performed_on)}.`
      errorMessage.value = null
      return true
    } catch (error) {
      errorMessage.value = `Could not save this workout to the API. ${messageFrom(error)}`
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
    isLoading,
    isLoadingLogs,
    errorMessage,
    successMessage,
    logDate,
    sortedWorkouts,
    workoutHistory,
    loadWorkouts,
    loadWorkoutLogs,
    lastLogFor,
    formatDate,
    logWorkout
  }
}
