import { ToneOnlyImage } from "./ToneOnlyImage";
import { CTASection } from "./CTASection";
import mistymorningmeadow from "./assets/morning-misty-meadow.jpg";
import beachFishing from "./assets/beach-fishing.jpg";
import mountainsandforest from "./assets/mountains-and-forest.jpg";
import rockyoceanshore from "./assets/rocky-ocean-shore.jpg";

export const Example = () => {
  return (
    <>
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
    </>
  );
};
