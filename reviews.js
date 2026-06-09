function _reviewCardHTML(rv) {
  const media = rv.video
    ? `<video class="review-media" src="${rv.video}" controls playsinline></video>`
    : rv.image
    ? `<img class="review-media" src="${rv.image}" alt="Review photo" loading="lazy">`
    : '';
  return `<div class="review-card">
    <div class="review-head">
      <span class="review-name">${rv.name}</span>
      <span class="review-stars">${'★'.repeat(rv.rating) + '☆'.repeat(5 - rv.rating)}</span>
    </div>
    <p class="review-date">${rv.date}</p>
    <p class="review-text">${rv.text}</p>
    ${media}
  </div>`;
}

const all = [...(window.FEATURED_REVIEWS || []), ...(window.POOL_REVIEWS || [])];
document.getElementById('reviewsListAll').innerHTML = all.map(_reviewCardHTML).join('');
