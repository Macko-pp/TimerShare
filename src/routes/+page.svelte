<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	import { Confetti } from 'svelte-confetti';
	let confetti = $state(false);
	function toggleConfetti() {
		confetti = !confetti;
	}

	import { io } from 'socket.io-client';
	const socket = io();

	import { Stopwatch } from '$lib/ts-stopwatch-custom';
	let stopwatch = new Stopwatch();

	import { v4 as uuidv4 } from 'uuid';
	const uuid = uuidv4();
	let id: string;

	let timeElapsed = $state(0);
	let stopwatchState = $state(stopwatch.getState());

	let actions: any = $state([]);

	function emitEvent(event: string, data: any = null) {
		socket.emit('eventFromClient', {
			event,
			id,
			uuid,
			data
		});
	}

	function sync() {
		emitEvent('sync', {
			startSystemTime: stopwatch.startSystemTime,
			stopSystemTime: stopwatch.stopSystemTime,
			stopDuration: stopwatch.stopDuration
		});
	}

	onMount(() => {
		const url = new URL(window.location.href);
		try {
			if (url.searchParams.has('id')) {
				id = url.searchParams.get('id')!;
			} else {
				id = uuidv4();
				url.searchParams.set('id', id);
				goto(url.toString(), { replaceState: true });
			}
		} catch (err) {
			console.error('Could not update URL with uuid', err);
		}

		emitEvent('join');
	});

	function start(emit: boolean = false, recordAction: boolean = true) {
		stopwatch.start();
		setInterval(() => {
			timeElapsed = stopwatch.getTime();
			stopwatchState = stopwatch.getState();
		}, 10);

		if (recordAction) {
			actions.unshift([
				'Start',
				new Date().toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit'
				}),
				'-'
			]);
		}

		if (emit) {
			emitEvent('start');
			sync();
		}
	}

	function stop(emit: boolean = false) {
		stopwatch.stop();

		actions.unshift([
			'Stop',
			new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
			formatTime(stopwatch.slice().duration)
		]);

		if (emit) {
			emitEvent('stop');
			sync();
		}
	}

	function reset(emit: boolean = false) {
		stopwatch.reset();

		actions.unshift([
			'Reset',
			new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
			'-'
		]);

		if (emit) {
			emitEvent('reset');
		}
	}

	function share() {
		const link = window.location.href;
		navigator.clipboard.writeText(link).then(() => {
			toggleConfetti();
		});
	}

	socket.on('eventFromServer', (message) => {
		// console.log('Received from server:', message);
		if (message.id == id && message.uuid != uuid) {
			if (message.event == 'start') {
				start(false);
			}

			if (message.event == 'stop') {
				stop(false);
			}

			if (message.event == 'reset') {
				reset(false);
			}

			if (message.event == 'sync') {
				let now = Date.now();
				let startTime = message.data.startSystemTime;
				let stopTime = message.data.stopSystemTime;
				let stoppedTotal = message.data.stopDuration || 0;

				let elapsedMs;

				if (typeof stopTime === 'number') {
					// stopwatch is currently paused: show the elapsed time up to the pause moment
					elapsedMs = stopTime - startTime - stoppedTotal;
				} else {
					// stopwatch is running: show elapsed up to "now", excluding paused durations
					elapsedMs = now - startTime - stoppedTotal;
				}

				stopwatch.setTime(elapsedMs);
				timeElapsed = elapsedMs;

				if (stopTime) {
					// stopwatch is paused
					stopwatch.stop(false);
				} else {
					// stopwatch is running
					start(false, false);
				}
			}

			if (message.event == 'join') {
				sync();
			}
		}
	});

	function formatTime(ms: number) {
		const totalSeconds = Math.floor(ms / 1000);
		const mins = Math.floor(totalSeconds / 60);
		const secs = totalSeconds % 60;
		const centis = Math.floor((ms % 1000) / 10);
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${centis.toString().padStart(2, '0')}`;
	}
</script>

<main class=" mt-40 flex flex-col items-center gap-y-7 text-center">
	<div class="flex items-center justify-center gap-6">
		<h1 class="ml-16 font-mono text-6xl">{formatTime(timeElapsed)}</h1>
		<button
			onclick={share}
			class="flex size-10 items-center justify-center rounded bg-blue-500 text-white hover:bg-blue-600"
			title="Copy the URL to clipboard"
			><svg
				width="20"
				height="20"
				viewBox="0 0 40 40"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M41 18.5L25 1.00003V9.75003C17 9.75003 1 15 1 36C1 33.0825 5.8 27.25 25 27.25V36L41 18.5Z"
					fill="white"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>

			{#if confetti}
				<div class="flex justify-center">
					<Confetti />
				</div>
			{/if}
		</button>
	</div>

	<div class="flex justify-center gap-14">
		<button
			onclick={() => start(true)}
			class="size-24 rounded-full bg-green-500 px-4 py-2 text-xl font-bold text-white hover:bg-green-600"
			>Start</button
		>
		<button
			onclick={() => stop(true)}
			class="size-24 rounded-full bg-yellow-500 px-4 py-2 text-xl font-bold text-white hover:bg-yellow-600"
			>Stop</button
		>
		<button
			onclick={() => reset(true)}
			class="size-24 rounded-full bg-red-500 px-4 py-2 text-xl font-bold text-white hover:bg-red-600"
			>Reset</button
		>
	</div>

	<div class="h-[5px] w-[35%] bg-gray-400"></div>

	<!-- <style>
		.fade-list li {
			opacity: 0;
			animation: fadeIn 300ms ease forwards;
		}
		@keyframes fadeIn {
			from {
				opacity: 0;
				transform: translateY(0);
			}
			to {
				opacity: 1;
				transform: translateY(6px);
			}
		}
	</style> -->

	<ul
		class="col-span-3 grid h-[300px] w-[35%] grid-cols-[1rem_auto_auto_auto] grid-rows-[32px_32px_32px_32px_32px_32px_32px_32px_32px] space-y-2 overflow-y-scroll"
	>
		{#each actions as action}
			<li class="flex items-center">
				{#if action[0] === 'Start'}
					<div class="size-2 rounded-full bg-green-500"></div>
				{/if}
				{#if action[0] === 'Stop'}
					<div class="size-2 rounded-full bg-yellow-500"></div>
				{/if}
				{#if action[0] === 'Reset'}
					<div class="size-2 rounded-full bg-red-500"></div>
				{/if}
			</li>
			<li class="text-left">{action[0]}</li>
			<li class="text-center">{action[1]}</li>
			<li class="text-right">{action[2]}</li>
		{/each}
	</ul>
</main>
