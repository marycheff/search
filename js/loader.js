export function showSkeletonLoader() {
   const skeletonHTML = `
		 <div class="loading-container">
			  <div class="skeleton skeleton-title"></div>
			  <div class="player-container">
					<div class="skeleton skeleton-player"></div>
					<div class="skeleton-sources">
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
