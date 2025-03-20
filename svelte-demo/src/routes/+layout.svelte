<script lang="ts">
  import { i18n } from '$lib/i18n';
  import { ParaglideJS } from '@inlang/paraglide-sveltekit';
  import Header from './Header.svelte';
  import '../app.css';

  let { children } = $props();
</script>

<ParaglideJS {i18n}>
  <div class="flex flex-col min-h-screen">
    <Header />
    
    <main class="flex-grow">
      {@render children()}
    </main>
    
    <footer class="bg-gray-800 text-white py-6">
      <div class="container mx-auto px-4">
        <div class="flex flex-col items-center justify-center">
          <p class="text-sm text-gray-300">
            &copy; {new Date().getFullYear()} Azure Weather App Demo
          </p>
          <div class="mt-2 flex space-x-4">
            <a href="https://azure.microsoft.com" class="text-gray-300 hover:text-white">
              Azure
            </a>
            <a href="https://learn.microsoft.com/en-us/azure/" class="text-gray-300 hover:text-white">
              Documentation
            </a>
            <a href="https://github.com/microsoft/azure-repos-vscode" class="text-gray-300 hover:text-white">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</ParaglideJS>