import { createOptimizedPicture, fetchPlaceholders, getMetadata } from '../../scripts/aem.js';

export default async function decorate(block) {
  block.classList.add('banner-block');

  const pic = block.querySelector('picture > img');
  if (pic) {
    const picture = pic.closest('picture');
    const optimizedPicture = createOptimizedPicture(pic.src, pic.alt, false, [{ width: '750' }]);
    picture.replaceWith(optimizedPicture);
  }
  // Process other elements in the block
  const textContent = [...block.children].filter((child) => !child.querySelector('picture'));
  textContent.forEach((content) => {
    content.classList.add('banner-text');
  });

  const placeholders = await fetchPlaceholders('fr'); 
  console.log("placeholder", placeholders);
}
