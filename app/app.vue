<template>
  <ClientOnly>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <template #fallback>
      <main class="grid min-h-screen place-items-center bg-gradient-to-br from-rose-50 via-white to-violet-50 px-4">
        <p class="rounded-2xl border border-violet-100 bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-sm">
          Loading Fit…
        </p>
      </main>
    </template>
  </ClientOnly>
</template>
