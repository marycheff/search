export function showSkeletonLoader() {
   const skeletonHTML = `
		 <div class="loading-container">
			  <div class="player-container">
					<div class="skeleton skeleton-player"></div>
					<div class="skeleton-sources">
						 <div class="skeleton skeleton-source"></div>
						 <div class="skeleton skeleton-source"></div>
						 <div class="skeleton skeleton-source"></div>
						 <div class="skeleton skeleton-source"></div>
						 <div class="skeleton skeleton-source"></div>
						 <div class="skeleton skeleton-source"></div>
						 <div class="skeleton skeleton-source"></div>
					</div>
			  </div>
		 </div>
	`
   return skeletonHTML
}

export function hideSkeletonLoader(element) {
   if (element) {
      element.innerHTML = ""
   }
}

export function showHeaderSkeleton() {
   const el = document.getElementById("headerMovieInfo")
   if (!el) return
   el.innerHTML = '<div class="skeleton skeleton-header-title"></div>'
}

export function hideHeaderSkeleton() {
   const el = document.getElementById("headerMovieInfo")
   if (el) el.innerHTML = ""
}
