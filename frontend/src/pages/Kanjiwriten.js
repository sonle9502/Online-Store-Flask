// src/pages/Search.js
import Header1 from '../ComponentsAmind/Header1.js';
import Footer from '../ComponentsAmind/Footer.js';
import ScrollToTopButton from '../ComponentsAmind/ScrollToTopButton.js';
import Kanjihandwriting from '../pagesAI/Kanjihandwriting.js';

const Kanjiwriten = () => {
  return (
    <div>
      <Header1 />
      <Kanjihandwriting />
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Kanjiwriten;
