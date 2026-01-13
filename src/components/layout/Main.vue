<template>
  <main class="main">
    <slot></slot>
  </main>
</template>

<style scoped>
.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 65px);
}
</style>
