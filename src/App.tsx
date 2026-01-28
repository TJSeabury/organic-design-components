import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { LipsumText } from "./LipsumText";
import { RadialLayout } from "./RadialLayout";
import { Shape } from "./Shape";
import hexagonDissection from "./assets/hexagon_dissection.png";
import { CTASection } from "./CTASection";
import { ToneOnlyImage } from "./ToneOnlyImage";
import matterhornSnowySunrise from "./assets/matterhorn_snowy_sunrise.png";
import mistymorningmeadow from "./assets/morning-misty-meadow.jpg";
import beachFishing from "./assets/beach-fishing.jpg";
import mountainsandforest from "./assets/mountains-and-forest.jpg";
import rockyoceanshore from "./assets/rocky-ocean-shore.jpg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <span className="block pt-32"></span>
      <RadialLayout
        elements={[
          <div>
            <a href="https://vite.dev" target="_blank">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
          </div>,
          <div>
            <a href="https://react.dev" target="_blank">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>,
          <div>
            <a href="https://vite.dev" target="_blank">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
          </div>,
          <div>
            <a href="https://react.dev" target="_blank">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>,
          <div>
            <a href="https://vite.dev" target="_blank">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
          </div>,
        ]}
      >
        <h1 className="text-3xl font-bold underline mb-4">Radial Layout</h1>
        <p className="text-center mb-4">
          This is a radial layout. It is a layout that places elements in a
          circular pattern. CSS now supports sin and cos functions, so no
          javascript is needed to position elements with polar coordinates.
        </p>
        <p className="text-center mb-4">
          The following shows how simple the CSS code is to convert back to
          cartesian coordinates.
        </p>
        <pre className="text-[12px] p-4 rounded-md max-w-[640px] mx-auto">
          <code className="block">
            {
              "--translate-x: calc(cos(${(TAU * (index / elements.length)) - offset}) * ${radius}px);"
            }
            <br />
            {
              "--translate-y: calc(sin(${(TAU * (index / elements.length)) - offset}) * ${radius}px);"
            }
          </code>
        </pre>
      </RadialLayout>

      <div>
        <CTASection
          backgroundImage={matterhornSnowySunrise}
          backgroundColor="#242424"
          overlayColor="#FED9C7"
          overlayOpacity={0.76}
          textColor="#222"
        >
          <h1 className="text-3xl font-bold text-[#222] mb-4">
            Please notice me!
          </h1>
          <p className="text-[#222] mb-4">
            We really really need you to click this button. Please click it.
          </p>
          <button className="bg-[#677B96] text-white px-4 py-2 rounded-md">
            Click me
          </button>
        </CTASection>

        <section className="w-full max-w-[100vw] flex items-center justify-center">
          <img
            src={matterhornSnowySunrise}
            alt="Matterhorn Snowy Sunrise"
            width={1920 / 2}
            height={1080 / 2}
            className="h-auto"
          />
          <ToneOnlyImage
            imageUrl={matterhornSnowySunrise}
            tone="light"
            width={1920 / 2}
            height={1080 / 2}
            className="h-auto"
          />
        </section>
      </div>

      <div>
        <CTASection
          backgroundImage={mistymorningmeadow}
          backgroundColor="#242424"
          overlayColor="#FED9C7"
          overlayOpacity={0.76}
          textColor="#222"
        >
          <h1 className="text-3xl font-bold text-[#222] mb-4">
            Please notice me!
          </h1>
          <p className="text-[#222] mb-4">
            We really really need you to click this button. Please click it.
          </p>
          <button className="bg-[#677B96] text-white px-4 py-2 rounded-md">
            Click me
          </button>
        </CTASection>

        <section className="w-full max-w-[100vw] flex items-center justify-center">
          <img
            src={mistymorningmeadow}
            alt="Matterhorn Snowy Sunrise"
            width={1920 / 2}
            height={1080 / 2}
            className="h-auto"
          />
          <ToneOnlyImage
            imageUrl={mistymorningmeadow}
            tone="light"
            width={1920 / 2}
            height={1080 / 2}
            className="h-auto"
          />
        </section>
      </div>

      <div>
        <CTASection
          backgroundImage={beachFishing}
          backgroundColor="#242424"
          overlayColor="#FED9C7"
          overlayOpacity={0.76}
          textColor="#222"
        >
          <h1 className="text-3xl font-bold text-[#222] mb-4">
            Please notice me!
          </h1>
          <p className="text-[#222] mb-4">
            We really really need you to click this button. Please click it.
          </p>
          <button className="bg-[#677B96] text-white px-4 py-2 rounded-md">
            Click me
          </button>
        </CTASection>

        <section className="w-full max-w-[100vw] flex items-center justify-center">
          <img
            src={beachFishing}
            alt="Matterhorn Snowy Sunrise"
            width={1920 / 2}
            height={1080 / 2}
            className="h-auto"
          />
          <ToneOnlyImage
            imageUrl={beachFishing}
            tone="light"
            width={1920 / 2}
            height={1080 / 2}
            className="h-auto"
          />
        </section>
      </div>

      <div>
        <CTASection
          backgroundImage={mountainsandforest}
          backgroundColor="#242424"
          overlayColor="#FED9C7"
          overlayOpacity={0.66}
          textColor="#222"
        >
          <h1 className="text-3xl font-bold text-[#222] mb-4">
            Please notice me!
          </h1>
          <p className="text-[#222] mb-4">
            We really really need you to click this button. Please click it.
          </p>
          <button className="bg-[#677B96] text-white px-4 py-2 rounded-md">
            Click me
          </button>
        </CTASection>

        <section className="w-full max-w-[100vw] flex items-center justify-center">
          <img
            src={mountainsandforest}
            alt="Matterhorn Snowy Sunrise"
            width={1920 / 2}
            height={1080 / 2}
            className="h-auto"
          />
          <ToneOnlyImage
            imageUrl={mountainsandforest}
            tone="light"
            width={1920 / 2}
            height={1080 / 2}
            className="h-auto"
          />
        </section>
      </div>

      <div>
        <CTASection
          backgroundImage={rockyoceanshore}
          backgroundColor="#242424"
          overlayColor="#FED9C7"
          overlayOpacity={0.76}
          textColor="#222"
        >
          <h1 className="text-3xl font-bold text-[#222] mb-4">
            Please notice me!
          </h1>
          <p className="text-[#222] mb-4">
            We really really need you to click this button. Please click it.
          </p>
          <button className="bg-[#677B96] text-white px-4 py-2 rounded-md">
            Click me
          </button>
        </CTASection>

        <section className="w-full max-w-[100vw] flex items-center justify-center">
          <img
            src={rockyoceanshore}
            alt="Matterhorn Snowy Sunrise"
            width={1920 / 2}
            height={1080 / 2}
            className="h-auto"
          />
          <ToneOnlyImage
            imageUrl={rockyoceanshore}
            tone="light"
            width={1920 / 2}
            height={1080 / 2}
            className="h-auto"
          />
        </section>
      </div>

      <section className="w-full max-w-[960px] mx-auto h-full my-32">
        <Shape
          imageUrl={hexagonDissection}
          width={450}
          height={450}
          shapeMargin={16}
        />

        <LipsumText w={200} p={4} />

        <Shape
          imageUrl={hexagonDissection}
          width={450}
          height={450}
          shapeMargin={16}
          float="right"
        />
        <LipsumText w={200} p={3} />
      </section>
    </>
  );
}

export default App;
