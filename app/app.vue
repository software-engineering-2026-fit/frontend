<template>
  <ClientOnly>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <template #fallback>
      <main class="grid min-h-screen place-items-center bg-white px-4">
        <p class="border border-slate-300 px-6 py-4 text-sm font-medium text-slate-600">
          Loading Fit…
        </p>
      </main>
    </template>
  </ClientOnly>
</template>
