import { ApiRequestError, requestApi, useAuth } from './useAuth'
import type { Workout } from './useWorkouts'

export interface Exercise {
  id: string
  name: string
  description: string | null
  muscle_group: string | null
  equipment: string | null
}

export interface WorkoutExercise {
  exercise: Exercise
  sets: number | null
  reps: number | null
  weight_kg: number | null
  exhaustion_level: number | null
}

export interface WorkoutLogExerciseInput {
  exercise_id: string
  sets: number
  reps: number
  weight_kg: number | null
  exhaustion_level: number | null
}

export interface WorkoutLogResponse {
  id: string
  workout_id: string
  workout_name: string
  performed_on: string
  exercises: Array<{
    exercise: Exercise
    sets: number
    reps: number
    weight_kg: number | null
    exhaustion_level: number | null
  }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isExercise(value: unknown): value is Exercise {
  return (
    isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && (typeof value.description === 'string' || value.description === null)
    && (typeof value.muscle_group === 'string' || value.muscle_group === null)
    && (typeof value.equipment === 'string' || value.equipment === null)
  )
}

function isWorkout(value: unknown): value is Workout {
  return (
    isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && (typeof value.description === 'string' || value.description === null)
    && typeof value.public === 'boolean'
  )
}

function isOptionalMetric(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value))
}

function isWorkoutExercise(value: unknown): value is WorkoutExercise {
  return (
    isRecord(value)
    && isExercise(value.exercise)
    && (typeof value.sets === 'number' || value.sets === null)
    && (typeof value.reps === 'number' || value.reps === null)
    && isOptionalMetric(value.weight_kg)
    && (typeof value.exhaustion_level === 'number' || value.exhaustion_level === null)
  )
}

function isWorkoutLogResponse(value: unknown): value is WorkoutLogResponse {
  return (
    isRecord(value)
    && typeof value.id === 'string'
    && typeof value.workout_id === 'string'
    && typeof value.workout_name === 'string'
    && typeof value.performed_on === 'string'
    && !Number.isNaN(Date.parse(value.performed_on))
    && Array.isArray(value.exercises)
    && value.exercises.every(
      item => isRecord(item)
        && isExercise(item.exercise)
        && typeof item.sets === 'number'
        && typeof item.reps === 'number'
        && isOptionalMetric(item.weight_kg)
        && (typeof item.exhaustion_level === 'number' || item.exhaustion_level === null)
    )
  )
}

export function useWorkoutApi() {
  const auth = useAuth()

  async function request(path: string, init: RequestInit = {}): Promise<unknown> {
    const token = auth.getToken()
    if (!token) {
      throw new Error('Your session has expired. Please sign in again.')
    }

    const headers = new Headers(init.headers)
    headers.set('authorization', `Bearer ${token}`)

    try {
      return await requestApi(path, { ...init, headers })
    } catch (error) {
      if (error instanceof ApiRequestError && error.statusCode === 401) {
        auth.signOut()
        await navigateTo('/login')
      }
      throw error
    }
  }

  async function getWorkout(workoutId: string): Promise<Workout> {
    const result = await request(`/workouts/${encodeURIComponent(workoutId)}`)
    if (!isWorkout(result)) {
      throw new Error('The API returned an invalid workout.')
    }
    return result
  }

  async function getWorkouts(): Promise<Workout[]> {
    const result = await request('/workouts/')
    if (!Array.isArray(result) || !result.every(isWorkout)) {
      throw new Error('The API returned an invalid workout list.')
    }
    return result
  }

  async function getWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
    const result = await request(`/workouts/${encodeURIComponent(workoutId)}/exercises`)
    if (!Array.isArray(result) || !result.every(isWorkoutExercise)) {
      throw new Error('The API returned an invalid workout exercise list.')
    }
    return result
  }

  async function searchExercises(
    query = '',
    limit = 100,
    offset = 0
  ): Promise<Exercise[]> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset)
    })
    if (query.trim()) {
      params.set('q', query.trim())
    }
    const result = await request(`/exercises/?${params.toString()}`)
    if (!Array.isArray(result) || !result.every(isExercise)) {
      throw new Error('The API returned an invalid exercise list.')
    }
    return result
  }

  async function createExercise(exercise: Omit<Exercise, 'id'>): Promise<Exercise> {
    const result = await request('/exercises/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(exercise)
    })
    if (!isExercise(result)) {
      throw new Error('The API returned an invalid exercise.')
    }
    return result
  }

  async function createWorkout(name: string): Promise<Workout> {
    const result = await request('/workouts/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: null,
        public: false
      })
    })
    if (!isWorkout(result)) {
      throw new Error('The API returned an invalid workout.')
    }
    return result
  }

  async function addWorkoutExercise(
    workoutId: string,
    exerciseId: string
  ): Promise<void> {
    const result = await request(
      `/workouts/${encodeURIComponent(workoutId)}/exercises`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          exercise_id: exerciseId
        })
      }
    )
    if (!Array.isArray(result) || !result.every(isWorkoutExercise)) {
      throw new Error('The API returned an invalid workout exercise list.')
    }
  }

  async function getWorkoutLogs(): Promise<WorkoutLogResponse[]> {
    const result = await request('/workout-logs/')
    if (!Array.isArray(result) || !result.every(isWorkoutLogResponse)) {
      throw new Error('The API returned an invalid workout log list.')
    }
    return result
  }

  async function createWorkoutLog(data: {
    workout_id: string
    performed_on: string
    exercises: WorkoutLogExerciseInput[]
  }): Promise<WorkoutLogResponse> {
    const result = await request('/workout-logs/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!isWorkoutLogResponse(result)) {
      throw new Error('The API returned an invalid workout log.')
    }
    return result
  }

  return {
    getWorkouts,
    getWorkout,
    getWorkoutExercises,
    searchExercises,
    createExercise,
    createWorkout,
    addWorkoutExercise,
    getWorkoutLogs,
    createWorkoutLog
  }
}
