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

	function start(emit: boolean = false) {
		stopwatch.start();
		setInterval(() => {
			timeElapsed = stopwatch.getTime();
			stopwatchState = stopwatch.getState();
		}, 10);

		if (emit) {
			emitEvent('start');
			sync();
		}
	}

	function stop(emit: boolean = false) {
		stopwatch.stop();

		if (emit) {
			emitEvent('stop');
			sync();
		}
	}

	function reset(emit: boolean = false) {
		stopwatch.reset();

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
					start(false);
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

<main class="mt-8 text-center">
	<h1>Stopwatch</h1>

	<!-- <input name="uuid" bind:value={localUUID} class="rounded border-2 border-black" /> -->

	<div class="my-4 font-mono text-6xl">{formatTime(timeElapsed)}</div>
	<div class="space-x-2">
		<button
			onclick={() => start(true)}
			class="rounded bg-blue-500 px-4 py-2 text-lg text-white hover:bg-blue-600">Start</button
		>
		<button
			onclick={() => stop(true)}
			class="rounded bg-yellow-500 px-4 py-2 text-lg text-white hover:bg-yellow-600">Stop</button
		>
		<button
			onclick={() => reset(true)}
			class="rounded bg-red-500 px-4 py-2 text-lg text-white hover:bg-red-600">Reset</button
		>
		<!-- <button
			onclick={sync}
			class="rounded bg-purple-500 px-4 py-2 text-lg text-white hover:bg-purple-600">Sync</button
		> -->
	</div>

	<div class="mt-3">
		<button
			onclick={share}
			class="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
			title="Copy the URL to clipboard"
		>
			Share Timer
			{#if confetti}
				<div class="flex justify-center">
					<Confetti />
				</div>
			{/if}
		</button>
	</div>
</main>
