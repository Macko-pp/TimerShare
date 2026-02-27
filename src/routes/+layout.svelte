<script lang="ts">
	// Global layout: load layout styles and favicon, render nested pages
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	// Props provided by SvelteKit: children is the page content to render
	let { children } = $props(); // render child route inside layout
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
