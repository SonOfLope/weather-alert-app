<script lang="ts">
  import { page } from '$app/state';
</script>

<header class="bg-white shadow">
  <div class="container mx-auto px-4">
    <div class="flex justify-between h-16">
      <div class="flex items-center">
        <div class="flex-shrink-0 flex items-center">
          <span class="text-blue-600 font-bold text-xl">Azure Weather</span>
        </div>
      </div>
      <nav class="flex items-center space-x-4">
        <a 
          href="/" 
          class={page.url.pathname === '/' ? 
            'text-blue-600 border-b-2 border-blue-600 py-5' : 
            'text-gray-500 hover:text-blue-600 py-5'}>
          Home
        </a>
        <a 
          href="/about" 
          class={page.url.pathname === '/about' ? 
            'text-blue-600 border-b-2 border-blue-600 py-5' : 
            'text-gray-500 hover:text-blue-600 py-5'}>
          About
        </a>
      </nav>
    </div>
  </div>
</header>