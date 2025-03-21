<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { setLanguageTag, availableLanguageTags, languageTag } from '$lib/paraglide/runtime.js'

  type LanguageTag = typeof availableLanguageTags[number];

  let selectedLang: LanguageTag = 'en';

  onMount(() => {
    if (!browser) return;

    const savedLang = localStorage.getItem('preferredLanguage') as LanguageTag;
    if (savedLang && availableLanguageTags.includes(savedLang)) {
      selectedLang = savedLang;
      setLanguageTag(savedLang);
    } else {
      selectedLang = languageTag();
    }
  });

  function handleLanguageChange() {
    if (!browser) return;
    
    if (availableLanguageTags.includes(selectedLang)) {
      localStorage.setItem('preferredLanguage', selectedLang);
      
      document.cookie = `paraglide_lang=${selectedLang};path=/;max-age=31536000`;
      
      setLanguageTag(selectedLang);
      
      window.location.reload();
    }
  }
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
          class="text-gray-500 hover:text-blue-600 py-5">
          Home
        </a>
        <a 
          href="/about" 
          class="text-gray-500 hover:text-blue-600 py-5">
          About
        </a>
        <select bind:value={selectedLang} on:change={handleLanguageChange}>
          {#each availableLanguageTags as tag}
            <option value={tag}>{tag}</option>
          {/each}
        </select>
      </nav>
    </div>
  </div>
</header>