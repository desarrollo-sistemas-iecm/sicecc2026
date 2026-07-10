<template>
  <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50">
        <tr>
          <slot name="head"></slot>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200">
        <slot name="body"></slot>
      </tbody>
    </table>
  </div>
</template>
