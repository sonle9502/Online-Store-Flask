// src/pages/Search.js
import Header1 from '../ComponentsAmind/Header1.js';
import Footer from '../ComponentsAmind/Footer.js';
import HandwritingInput from '../pagesAI/HandwritingInput.js';
import ScrollToTopButton from '../ComponentsAmind/ScrollToTopButton.js';

const Handwritten = () => {
  return (
    <div>
      <Header1 />
      <HandwritingInput />
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Handwritten;
