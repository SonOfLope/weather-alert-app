<script>
  // You can import any components or data here if needed
</script>

<svelte:head>
  <title>About | Azure Weather Demo</title>
  <meta name="description" content="About the Montreal Weather App deployed on Azure" />
</svelte:head>

<div class="container mx-auto px-4 py-12">
  <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
    <div class="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
      <h1 class="text-3xl font-bold">About This App</h1>
      <p class="text-blue-100">Learn about our Azure-deployed weather application</p>
    </div>
    
    <div class="p-8">
      <div class="prose prose-blue max-w-none">
        <h2>Project Overview</h2>
        <p>
          This weather application is built with SvelteKit and deployed on Microsoft Azure App Services.
          It serves as a demonstration of modern web development practices and cloud deployment techniques.
        </p>
        
        <h2>Technologies Used</h2>
        <ul>
          <li><strong>Frontend:</strong> SvelteKit, Tailwind CSS</li>
          <li><strong>Deployment:</strong> Azure App Services</li>
          <li><strong>CI/CD:</strong> GitHub Actions</li>
          <li><strong>Internationalization:</strong> Inlang Paraglide</li>
        </ul>
        
        <h2>Azure Deployment Features</h2>
        <p>
          Our application leverages several Azure features:
        </p>
        <ul>
          <li><strong>Deployment Slots:</strong> We use staging slots for testing before production</li>
          <li><strong>Scaling:</strong> Configured for automatic scaling based on demand</li>
          <li><strong>Monitoring:</strong> Azure Application Insights integration</li>
        </ul>
        
        <h2>Learning Resources</h2>
        <p>
          This project is part of learning the AZ-204 certification. Here are some helpful resources:
        </p>
        <ul>
          <li><a href="https://learn.microsoft.com/en-us/azure/app-service/" class="text-blue-600 hover:underline">Azure App Service Documentation</a></li>
          <li><a href="https://learn.microsoft.com/en-us/azure/azure-monitor/" class="text-blue-600 hover:underline">Azure Monitoring</a></li>
          <li><a href="https://svelte.dev/" class="text-blue-600 hover:underline">SvelteKit Documentation</a></li>
        </ul>
      </div>
    </div>
  </div>
</div>