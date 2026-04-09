import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { ChevronRight } from "lucide-react";

const bodyRegions = [
  { id: "neck", label: "Neck", exercises: [
    { title: "Chin Tucks", description: "Improve cervical posture by gently retracting the chin." },
    { title: "Neck Rotation Stretch", description: "Gently rotate the head to improve range of motion." },
    { title: "Levator Scapulae Stretch", description: "Stretch the side and back of the neck to relieve tension." },
    { title: "Isometric Neck Strengthening", description: "Build neck stability using controlled resistance." },
  ]},
  { id: "shoulder", label: "Shoulder", exercises: [
    { title: "Pendulum Swings", description: "Gentle motion to reduce shoulder stiffness and pain." },
    { title: "External Rotation with Band", description: "Strengthen the rotator cuff with resistance band exercises." },
    { title: "Wall Slides", description: "Improve overhead mobility with controlled wall movements." },
    { title: "Scapular Squeezes", description: "Strengthen muscles between the shoulder blades." },
  ]},
  { id: "elbow", label: "Elbow", exercises: [
    { title: "Wrist Extensor Stretch", description: "Relieve tension from lateral epicondylitis (tennis elbow)." },
    { title: "Wrist Flexor Stretch", description: "Address medial epicondylitis (golfer's elbow)." },
    { title: "Forearm Pronation/Supination", description: "Improve forearm rotation and elbow stability." },
  ]},
  { id: "wrist-hand", label: "Wrist / Hand", exercises: [
    { title: "Wrist Circles", description: "Maintain wrist mobility with gentle circular motions." },
    { title: "Grip Strengthening", description: "Improve hand grip using a stress ball or therapy putty." },
    { title: "Finger Tendon Glides", description: "Maintain tendon mobility in the hand and fingers." },
  ]},
  { id: "hip", label: "Hip", exercises: [
    { title: "Clamshells", description: "Strengthen hip external rotators and gluteus medius." },
    { title: "Hip Flexor Stretch", description: "Address tightness from prolonged sitting." },
    { title: "Glute Bridges", description: "Build posterior chain strength and hip stability." },
    { title: "Piriformis Stretch", description: "Relieve deep hip and sciatic tension." },
  ]},
  { id: "knee", label: "Knee", exercises: [
    { title: "Quad Sets", description: "Activate and strengthen the quadriceps without joint stress." },
    { title: "Straight Leg Raises", description: "Build quadriceps strength in a controlled manner." },
    { title: "Hamstring Curls", description: "Strengthen the posterior thigh for knee stability." },
    { title: "Wall Sits", description: "Build endurance in the thighs and improve knee control." },
  ]},
  { id: "ankle-foot", label: "Ankle / Foot", exercises: [
    { title: "Ankle Alphabet", description: "Trace letters with your foot to improve ankle mobility." },
    { title: "Calf Raises", description: "Strengthen the gastrocnemius and soleus muscles." },
    { title: "Towel Scrunches", description: "Strengthen intrinsic foot muscles for arch support." },
    { title: "Balance Training", description: "Single-leg stance to improve proprioception." },
  ]},
];

const PTExercises = () => {
  const [openRegion, setOpenRegion] = useState<string | null>(null);

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">Physical Therapy</p>
            <h1 className="text-4xl font-bold text-foreground mb-4">Home Exercises</h1>
            <p className="text-muted-foreground text-lg">
              Structured rehabilitation exercises organized by body region. Select a region below to view exercises.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {bodyRegions.map((region) => (
              <div key={region.id} className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <button
                  onClick={() => setOpenRegion(openRegion === region.id ? null : region.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold text-foreground text-lg">{region.label}</span>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${openRegion === region.id ? "rotate-90" : ""}`} />
                </button>
                {openRegion === region.id && (
                  <div className="border-t border-border px-5 pb-5">
                    <div className="grid gap-4 pt-4">
                      {region.exercises.map((ex) => (
                        <div key={ex.title} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                          <div>
                            <h4 className="font-medium text-foreground">{ex.title}</h4>
                            <p className="text-sm text-muted-foreground">{ex.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/pt-locations" className="text-primary font-medium hover:underline">
              View Physical Therapy Locations →
            </Link>
          </div>
        </div>
      </section>
      <ContactCTA />
    </Layout>
  );
};

export default PTExercises;
