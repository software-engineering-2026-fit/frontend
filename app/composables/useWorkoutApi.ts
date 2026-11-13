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
  description: string | null
}

export interface WorkoutSessionLogInput {
  exercise_id: string
  weight: number | null
  reps: number | null
  exhaustion_level: number | null
}

export interface WorkoutSessionLog {
  id: string
  workout_session_id: string
  exercise_id: string
  exercise_name: string
  weight: number | null
  reps: number | null
  exhaustion_level: number | null
  timestamp: string
}

export interface WorkoutSession {
  id: string
  user_workout_id: string
  date: string
  ended_at: string | null
  logs: WorkoutSessionLog[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === 'string'
}

function normalizeExercise(value: unknown): Exercise | null {
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.name !== 'string'
    || !isNullableString(value.description)
    || !isNullableString(value.muscle_group)
    || !isNullableString(value.equipment)
  ) {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    description: value.description ?? null,
    muscle_group: value.muscle_group ?? null,
    equipment: value.equipment ?? null
  }
}

function normalizeWorkout(value: unknown): Workout | null {
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.name !== 'string'
    || !isNullableString(value.description)
    || (value.public !== undefined && typeof value.public !== 'boolean')
  ) {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    description: value.description ?? null,
    public: value.public === true
  }
}

function isNullableMetric(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value))
}

function normalizeWorkoutExercise(value: unknown): WorkoutExercise | null {
  if (
    !isRecord(value)
    || (typeof value.description !== 'string' && value.description !== null)
  ) {
    return null
  }

  const exercise = normalizeExercise(value.exercise)
  if (!exercise) {
    return null
  }

  return {
    exercise,
    description: value.description
  }
}

function isWorkoutSessionLog(value: unknown): value is WorkoutSessionLog {
  return (
    isRecord(value)
    && typeof value.id === 'string'
    && typeof value.workout_session_id === 'string'
    && typeof value.exercise_id === 'string'
    && typeof value.exercise_name === 'string'
    && isNullableMetric(value.weight)
    && (value.reps === null || Number.isInteger(value.reps))
    && (value.exhaustion_level === null || Number.isInteger(value.exhaustion_level))
    && typeof value.timestamp === 'string'
    && !Number.isNaN(Date.parse(value.timestamp))
  )
}

function isWorkoutSession(value: unknown): value is WorkoutSession {
  return (
    isRecord(value)
    && typeof value.id === 'string'
    && typeof value.user_workout_id === 'string'
    && typeof value.date === 'string'
    && !Number.isNaN(Date.parse(value.date))
    && (value.ended_at === null || (
      typeof value.ended_at === 'string' && !Number.isNaN(Date.parse(value.ended_at))
    ))
    && Array.isArray(value.logs)
    && value.logs.every(isWorkoutSessionLog)
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
    const result = normalizeWorkout(
      await request(`/workouts/${encodeURIComponent(workoutId)}`)
    )
    if (!result) {
      throw new Error('The API returned an invalid workout.')
    }
    return result
  }

  async function getWorkouts(): Promise<Workout[]> {
    const result = await request('/workouts/')
    if (!Array.isArray(result)) {
      throw new Error('The API returned an invalid workout list.')
    }

    const workouts: Workout[] = []
    for (const item of result) {
      const workout = normalizeWorkout(item)
      if (!workout) {
        throw new Error('The API returned an invalid workout list.')
      }
      workouts.push(workout)
    }
    return workouts
  }

  async function getWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
    const result = await request(`/workouts/${encodeURIComponent(workoutId)}/exercises`)
    if (!Array.isArray(result)) {
      throw new Error('The API returned an invalid workout exercise list.')
    }

    const workoutExercises: WorkoutExercise[] = []
    for (const item of result) {
      const workoutExercise = normalizeWorkoutExercise(item)
      if (!workoutExercise) {
        throw new Error('The API returned an invalid workout exercise list.')
      }
      workoutExercises.push(workoutExercise)
    }
    return workoutExercises
  }

  async function searchExercises(
    query = '',
    limit = 100,
    offset = 0
  ): Promise<Exercise[]> {
    const result = await request('/exercises/')
    if (!Array.isArray(result)) {
      throw new Error('The API returned an invalid exercise list.')
    }

    const exercises: Exercise[] = []
    for (const item of result) {
      const exercise = normalizeExercise(item)
      if (!exercise) {
        throw new Error('The API returned an invalid exercise list.')
      }
      exercises.push(exercise)
    }

    const normalizedQuery = query.trim().toLocaleLowerCase()
    return exercises
      .filter(exercise => !normalizedQuery || [
        exercise.name,
        exercise.description,
        exercise.muscle_group,
        exercise.equipment
      ].some(value => value?.toLocaleLowerCase().includes(normalizedQuery)))
      .slice(offset, offset + limit)
  }

  async function createExercise(exercise: Omit<Exercise, 'id'>): Promise<Exercise> {
    const result = normalizeExercise(await request('/exercises/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(exercise)
    }))
    if (!result) {
      throw new Error('The API returned an invalid exercise.')
    }
    return result
  }

  async function createWorkout(name: string): Promise<Workout> {
    const result = normalizeWorkout(await request('/workouts/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: null,
        public: false
      })
    }))
    if (!result) {
      throw new Error('The API returned an invalid workout.')
    }
    return result
  }

  async function addWorkoutExercise(
    workoutId: string,
    exerciseId: string,
    description: string | null
  ): Promise<void> {
    const result = await request(
      `/workouts/${encodeURIComponent(workoutId)}/exercises`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          exercise_id: exerciseId,
          description
        })
      }
    )
    if (
      !Array.isArray(result)
      || !result.every(item => normalizeWorkoutExercise(item) !== null)
    ) {
      throw new Error('The API returned an invalid workout exercise list.')
    }
  }

  async function getWorkoutSessions(): Promise<WorkoutSession[]> {
    const result = await request('/workout-sessions/')
    if (!Array.isArray(result) || !result.every(isWorkoutSession)) {
      throw new Error('The API returned an invalid workout session list.')
    }
    return result
  }

  async function createWorkoutSession(
    workoutId: string,
    date: string
  ): Promise<WorkoutSession> {
    const result = await request('/workout-sessions/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ workout_id: workoutId, date })
    })
    if (!isWorkoutSession(result)) {
      throw new Error('The API returned an invalid workout session.')
    }
    return result
  }

  async function addWorkoutSessionLog(
    sessionId: string,
    data: WorkoutSessionLogInput
  ): Promise<WorkoutSessionLog> {
    const result = await request(
      `/workout-sessions/${encodeURIComponent(sessionId)}/logs`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      }
    )
    if (!isWorkoutSessionLog(result)) {
      throw new Error('The API returned an invalid workout session log.')
    }
    return result
  }

  async function endWorkoutSession(sessionId: string): Promise<WorkoutSession> {
    const result = await request(
      `/workout-sessions/${encodeURIComponent(sessionId)}/end`,
      { method: 'POST' }
    )
    if (!isWorkoutSession(result)) {
      throw new Error('The API returned an invalid completed workout session.')
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
    getWorkoutSessions,
    createWorkoutSession,
    addWorkoutSessionLog,
    endWorkoutSession
  }
}
