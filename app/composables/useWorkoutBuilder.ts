import type { Exercise } from './useWorkoutApi'

export interface WorkoutDraftExercise {
  exercise: Exercise
}

export function useWorkoutBuilder() {
  const name = useState('workout-builder-name', () => '')
  const exercises = useState<WorkoutDraftExercise[]>('workout-builder-exercises', () => [])

  function toggleExercise(exercise: Exercise) {
    const existingIndex = exercises.value.findIndex(
      item => item.exercise.id === exercise.id
    )
    if (existingIndex >= 0) {
      exercises.value.splice(existingIndex, 1)
      return
    }
    exercises.value.push({ exercise })
  }

  function clear() {
    name.value = ''
    exercises.value = []
  }

  return { name, exercises, toggleExercise, clear }
}
