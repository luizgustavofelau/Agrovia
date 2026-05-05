import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

interface DropProps {
  index: number;
  scrollProgress: any;
}

const Drop: React.FC<DropProps> = ({ index, scrollProgress }) => {
  const dropY = useTransform(scrollProgress, [0, 1], [0, 600 + index * 50]);
  const opacity = useTransform(scrollProgress, [0.5, 1], [0, 1]);
  const delay = index * 0.1;

  return (
    <motion.svg
      width="20"
      height="30"
      viewBox="0 0 20 30"
      className="absolute"
      style={{
        left: `${20 + index * 8}%`,
        y: dropY,
        opacity,
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ delay, duration: 2, ease: "easeInOut" }}
    >
      <path
        d="M10 0 C6 0 3 3 3 7 C3 11 10 20 10 20 C10 20 17 11 17 7 C17 3 14 0 10 0 Z"
        fill="#00BFFF"
        stroke="#0080FF"
        strokeWidth="1"
      />
    </motion.svg>
  );
};

const ParallaxDrops: React.FC = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const numDrops = 10;
  const drops = useMemo(() => Array.from({ length: numDrops }, (_, i) => i), []);

  const handleLoginClick = () => {
    navigate("/painel");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-green-100 to-green-200">
      <div className="h-screen flex items-center justify-center">
        <h1 className="text-4xl font-bold text-green-800">Agrovia - Sistema de Irrigacao Inteligente</h1>
      </div>

      <motion.div
        className="relative h-screen flex items-center justify-center overflow-hidden"
        style={{ y }}
      >
        <div className="absolute bottom-0 w-full">
          <img
            src="/img/solo.jpg"
            alt="Solo"
            className="w-full h-64 object-cover"
          />
        </div>

        {drops.map((index) => (
          <Drop key={index} index={index} scrollProgress={scrollYProgress} />
        ))}
      </motion.div>

      <motion.div
        className="flex justify-center py-10 bg-green-900"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <button
          onClick={handleLoginClick}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
        >
          Acessar Plataforma
        </button>
      </motion.div>
    </div>
  );
};

export default ParallaxDrops;
