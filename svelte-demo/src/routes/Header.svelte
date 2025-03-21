<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { setLanguageTag, availableLanguageTags, languageTag } from '$lib/paraglide/runtime.js'

  type LanguageTag = typeof availableLanguageTags[number];

  // Initialize with default language
  let selectedLang: LanguageTag = 'en';

  onMount(() => {
    // Only run this code on the client-side
    if (!browser) return;

    // First check cookie
    const cookies = document.cookie.split(';');
    const langCookie = cookies.find(cookie => cookie.trim().startsWith('paraglide_lang='));
    const langFromCookie = langCookie ? langCookie.split('=')[1] : null;

    if (langFromCookie && availableLanguageTags.includes(langFromCookie as LanguageTag)) {
      selectedLang = langFromCookie as LanguageTag;
      setLanguageTag(selectedLang);
    } else {
      // Try local storage next
      const savedLang = localStorage.getItem('preferredLanguage') as LanguageTag;
      if (savedLang && availableLanguageTags.includes(savedLang)) {
        selectedLang = savedLang;
        setLanguageTag(savedLang);
      } else {
        // Finally use current language
        selectedLang = languageTag();
      }
    }
  });

  function handleLanguageChange() {
    if (!browser) return;
    
    if (availableLanguageTags.includes(selectedLang)) {
      // Store the selected language in localStorage for persistence
      localStorage.setItem('preferredLanguage', selectedLang);
      
      // Set the language cookie directly with proper attributes
      document.cookie = `paraglide_lang=${selectedLang};path=/;max-age=31536000;SameSite=Lax`;
      
      // Set language
      setLanguageTag(selectedLang);
      
      // Force a full page navigation by changing location to ensure the server picks up the new cookie
      const currentUrl = new URL(window.location.href);
      currentUrl.search += (currentUrl.search ? '&' : '?') + '_lang=' + selectedLang;
      window.location.href = currentUrl.toString();
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
        <select bind:value={selectedLang} on:change={handleLanguageChange} class="border rounded px-2 py-1">
          {#each availableLanguageTags as tag}
            <option value={tag}>{tag.toUpperCase()}</option>
          {/each}
        </select>
      </nav>
    </div>
  </div>
</header>