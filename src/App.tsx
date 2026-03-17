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
import rockyoceanshore from "./assets/rocky-ocean-shore.jpg";
import { ColorGradedImage } from "./ColorGradedImage";
import { MouseParallaxSection } from "./MouseParallaxSection";
import { MouseParallaxImageStack } from "./MouseParallaxImageStack";
import { MarchingSquaresExample } from "./MarchingSquaresExample";

function App() {
  return (
    <>
      <section className="w-full max-w-[960px] mx-auto h-full my-32 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Fast liquid simulation with LERPed Marching Squares rendering.
        </h1>
        <p className="text-center mb-4">
          This demo shows how to implement a fast liquid simulation with LERPed
          Marching Squares rendering. It can be used as a base for interactable
          components. Try clicking and dragging the liquid to see the effect.
        </p>
        <MarchingSquaresExample />
      </section>

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
        <section className="w-full max-w-[960px] mx-auto h-full my-24 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Call-to-action section with image-aware color blocking.
          </h2>
          <p className="text-center mb-4 max-w-prose">
            This hero-style CTA blends a photographic background with an
            overlaid color block, demonstrating how layout and color can be
            combined to keep text readable while still feeling immersive.
          </p>
        </section>

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

        <section className="w-full max-w-[960px] mx-auto h-full my-24 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Full-viewport mouse parallax background.
          </h2>
          <p className="text-center mb-4 max-w-prose">
            This section shows how to wire up a cursor-driven parallax effect
            that keeps content locked to the center while the background drifts
            subtly underneath.
          </p>
        </section>

        <MouseParallaxSection backgroundImageUrl={mistymorningmeadow}>
          <div className="flex flex-col items-center justify-center bg-[#214343cc] p-12 rounded-md shadow-md">
            <h2 className="text-4xl font-bold mb-4">Subtle Mouse Parallax</h2>
            <p className="mb-6 text-lg max-w-prose mx-auto">
              This section fills the viewport and gently shifts the background
              in response to your cursor, while keeping this content locked to
              the center.
            </p>
            <button className="inline-flex items-center justify-center rounded-full bg-white/90 px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-black/40 hover:bg-white text-white">
              Explore the motion
            </button>
          </div>
        </MouseParallaxSection>

        <section className="w-full max-w-[960px] mx-auto h-full my-24 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Automated color grading with WebAssembly-accelerated image
            processing.
          </h2>
          <p className="text-center mb-4 max-w-prose">
            This automated color-grading example demonstrates that techniques
            once limited to native tools like Photoshop can now run entirely in
            the browser by offloading CPU-intensive work to WebAssembly.
          </p>
        </section>

        <section className="w-full max-w-[100vw] flex items-center justify-center">
          <img
            src={rockyoceanshore}
            alt="Rocky Ocean Shore"
            width={1920 / 2}
            height={1080 / 2}
            className="h-auto max-w-[1920px]"
          />
          <ColorGradedImage
            imageUrl={rockyoceanshore}
            width={1920 / 2}
            height={1080 / 2}
            className="h-auto max-w-[1920px]"
          />
        </section>

        <section className="w-full max-w-[960px] mx-auto h-full my-24 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Layered mouse parallax for image stacks.
          </h2>
          <p className="text-center mb-4 max-w-prose">
            Here, multiple translucent color plates and the foreground image all
            move at different speeds in response to the cursor, creating a
            depthy, tactile feel suitable for hero imagery or product shots.
          </p>
        </section>

        <section className="w-full max-w-[100vw] flex items-center justify-center gap-10 py-24">
          <MouseParallaxImageStack className="max-w-[960px]">
            <img
              src={matterhornSnowySunrise}
              alt="Matterhorn Snowy Sunrise"
              width={1920 / 2}
              height={1080 / 2}
              className="h-auto w-full object-cover"
            />
          </MouseParallaxImageStack>

          <MouseParallaxImageStack className="max-w-[960px]">
            <ToneOnlyImage
              imageUrl={matterhornSnowySunrise}
              width={1920 / 2}
              height={1080 / 2}
              className="h-auto w-full object-cover"
            />
          </MouseParallaxImageStack>
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
