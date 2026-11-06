export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return
  }

  const auth = useAuth()
  await auth.initialize()

  if (to.path === '/login') {
    if (auth.user.value) {
      return navigateTo('/workouts')
    }

    return
  }

  if (!auth.user.value) {
    return navigateTo('/login')
  }
})
