;(function StopAutoplay(window) {
	'use strict'

	const document = window.document;

	function _pause(player) {
		console.log('pause', player, player.currentTime)
		if (player.pause !== undefined) {
			player.pause()
			return
		}
		player.pauseVideo() // Flash API
	}

	function stopAutoplay(player) {
		console.log(
			'stopAutoplay',
			!player.loop,
			document.location.search.indexOf('list=') === -1,
			document.hidden,
			player
		)
		// don't stop looping videos or playlists
		if (
			!player.loop &&
			document.location.search.indexOf('list=') === -1 &&
			!document.hasFocus()
		) {
			_pause(player)
			return true
		}
		return false
	}

	const boundPlayers = new WeakSet()
	function bindPlayer(player) {
		if (boundPlayers.has(player)) return
		boundPlayers.add(player)

		console.info('binding', player)

		// don't pause while buffering
		console.log(player.readyState, player.networkState)
		if (player.readyState > 1) {
			stopAutoplay(player)
		}

		/** Main stop function */
		player.addEventListener(
			'canplaythrough',
			stopAutoplay.bind(undefined, player)
		)
	}

	/**
	 * Installs an observer which waits for video elements.
	 */
	function waitForPlayer() {
		const observer = new MutationObserver(function(mutations) {
			for (let i = 0; i < mutations.length; ++i) {
				let mutation = mutations[i].addedNodes
				for (let x = 0; x < mutation.length; ++x) {
					if (
						mutation[x].nodeName !== 'VIDEO' &&
						mutation[x].nodeName !== 'OBJECT'
					)
						continue
					console.log('mutation', mutation[x])

					observer.disconnect() // waiting is over
					bindPlayer(mutation[x])

					return
				}
			}
		})
		observer.observe(document, { childList: true, subtree: true })
	}

	/**
	 * Binds non /watch / channel specific event handlers.
	 */
	function bindGeneral() {
		// safety, if there is any other extension for example.
		const original = window.onYouTubePlayerReady // onYoutubeIframeAPIReady

		/**
		 * Stops videos on channels.
		 * Only fired once when a player is ready (e.g. doesn't fire on AJAX navigation /watch -> /watch)
		 *
		 * @param {Object} player The Youtube Player API Object
		 */
		window.onYouTubePlayerReady = function onYouTubePlayerReady(player) {
			console.log(
				'player ready',
				player,
				player.getPlayerState(),
				player.getCurrentTime()
			)

			if (player.getPlayerState() !== 3) {
				// don't pause too early
				console.log(player.getCurrentTime())
				bindPlayer(document.getElementsByTagName('video')[0])
			}

			if (original !== undefined) original()
		}
	}

	// start
	let video = document.getElementsByTagName('video')
	if (video.length !== 0) {
		bindPlayer(video[0])
		video = null // GC
	} else waitForPlayer()

	bindGeneral()

	console.info('started')
})(window)
