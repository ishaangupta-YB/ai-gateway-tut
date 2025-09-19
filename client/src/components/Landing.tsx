"use client";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeroHighlight, Highlight } from '@/components/ui/hero-highlight';
import { CometCard } from '@/components/ui/comet-card';
import { Compare } from '@/components/ui/compare';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import {
  ArrowRight,
  Bot,
  Sparkles, 
  Shield,
  Menu,
  X,
  PlayCircle,
  Search,
  Settings
} from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const CompareDemo =  ({firstImage, secondImage}: {firstImage: string, secondImage: string}) => {
    return (
      <div className="w-full max-w-7xl h-[80vh] px-2 md:px-8 flex items-center justify-center [perspective:1000px] [transform-style:preserve-3d]">
        <div
          style={{
            transform: "rotateX(12deg) translateZ(100px)",
          }}
          className="p-2 md:p-6 border rounded-3xl bg-card border-border mx-auto w-full h-3/4 md:h-5/6"
        >
          <Compare
            firstImage={firstImage}
            secondImage={secondImage}
            firstImageClassName="object-cover object-left-top w-full"
            secondImageClassname="object-cover object-left-top w-full"
            className="w-full h-full rounded-[22px] md:rounded-lg"
            slideMode="hover"
            autoplay={true}
          />
        </div>
      </div>
    );
  };

  const DemoVideoModal = () => {
    return (
      <Dialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen}>
        <DialogTrigger asChild>
          <HoverBorderGradient
            containerClassName="rounded-lg"
            as="button"
            className="bg-background cursor-pointer hover:bg-background/90 text-foreground border border-border flex items-center space-x-2 text-base sm:text-lg px-4 sm:px-8 md:px-12 py-3"
          >
            <PlayCircle className="h-5 w-5" />
            <span>Watch Demo</span>
          </HoverBorderGradient>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-5xl h-[85vh] p-0 border-0 bg-transparent">
          <div className="relative w-full h-full bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex flex-col">
            <DialogHeader className="flex-shrink-0 p-6 border-b border-border/30">
              <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <PlayCircle className="h-5 w-5 text-primary" />
                </div>
                AI Pasta Demo
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground mt-2">
                See how AI Pasta revolutionizes multi-model AI conversations
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 p-6 min-h-0">
              <div className="w-full h-full bg-black rounded-xl overflow-hidden shadow-inner border border-border/20">
                <video
                  className="w-full h-full object-contain"
                  src="demo.mp4"
                  title="AI Pasta Demo Video"
                  controls
                  preload="metadata"
                  style={{ backgroundColor: '#000' }}
                />
              </div>
            </div>

            <DialogClose className="absolute top-4 right-4 z-20 rounded-full p-2.5 bg-background/80 backdrop-blur-sm hover:bg-background border border-border/50 transition-all duration-200 hover:scale-105 shadow-lg"/>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const GlowingEffectDemo = () => {
    return (
      <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
        <GridItem
          area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
          icon={<Bot className="h-4 w-4 text-foreground" />}
          title="Multi-Model Support"
          description="Access multiple AI models simultaneously - GPT-4, Claude, Gemini, and more in one interface."
        />

        <GridItem
          area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
          icon={<Settings className="h-4 w-4 text-foreground" />}
          title="Smart Configuration"
          description="Intelligent settings that adapt to your workflow and preferences automatically."
        />

        <GridItem
          area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
          icon={<Shield className="h-4 w-4 text-foreground" />}
          title="Privacy First Design"
          description="Your conversations are secure and private with no data retention policies."
        />

        <GridItem
          area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
          icon={<Sparkles className="h-4 w-4 text-foreground" />}
          title="AI-Powered Insights"
          description="Get intelligent suggestions and insights from your multi-model conversations."
        />
        <GridItem
          area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
          icon={<Search className="h-4 w-4 text-foreground" />}
          title="Real-time Web Search"
          description="Enhanced responses with live web search capabilities powered by Perplexity."
        />
      </ul>
    );
  };

  interface GridItemProps {
    area: string;
    icon: React.ReactNode;
    title: string;
    description: React.ReactNode;
  }

  const GridItem = ({ area, icon, title, description }: GridItemProps) => {
    return (
      <li className={`min-h-[14rem] list-none ${area}`}>
        <div className="relative h-full rounded-2xl border border-border p-2 md:rounded-3xl md:p-3">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 bg-card/50 backdrop-blur-sm">
            <div className="relative flex flex-1 flex-col justify-between gap-3">
              <div className="w-fit rounded-lg border border-border p-2 bg-muted/50">
                {icon}
              </div>
              <div className="space-y-3">
                <h3 className="font-sans text-xl/[1.375rem] font-semibold text-balance text-foreground md:text-2xl/[1.875rem]">
                  {title}
                </h3>
                <h2 className="font-sans text-sm/[1.125rem] text-muted-foreground md:text-base/[1.375rem]">
                  {description}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">AI Pasta</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <ModeToggle />
            <Link to="/chat">
              <Button className="cursor-pointer">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 space-y-3">
            <Link to="/chat" className="block">
              <Button className="w-full cursor-pointer">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <HeroHighlight>
        <motion.h1
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: [20, -5, 0],
          }}
          transition={{
            duration: 0.5,
            ease: [0.4, 0.0, 0.2, 1],
          }}
          className="text-4xl px-4 sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground max-w-6xl leading-tight lg:leading-tight text-center mx-auto"
        >
          Chat with Multiple AI Models{" "}
          <Highlight className="text-foreground">
            Simultaneously & Intelligently
          </Highlight>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <Link to="/chat">
            <HoverBorderGradient
              containerClassName="rounded-lg"
              as="button"
              className="bg-primary text-primary-foreground flex items-center space-x-2 text-base sm:text-lg px-4 sm:px-8 md:px-12 py-3 hover:bg-primary/90 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className=" ml-2 h-5 w-5" /> 
            </HoverBorderGradient>
          </Link>
          <DemoVideoModal />
        </motion.div>
      </HeroHighlight>

      {/* Compare Demo Section */}
      <section className="container px-4 py-24 mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            See it in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compare responses from different AI models side by side
          </p>
        </div>
        <div className="flex justify-center">
          <CompareDemo firstImage="https://assets.aceternity.com/notes-dark.png" secondImage="https://assets.aceternity.com/linear-dark.png" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container px-4 py-12 mx-auto">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="outline">Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything you need for AI conversations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to enhance your AI interactions and productivity.
          </p>
        </div>

        <GlowingEffectDemo />
      </section>


      {/* Comet Card Demo Section */}
      <section className="container px-4 py-4 mx-auto">
        <div className="flex justify-center">
          <CometCard>
            <button
              type="button"
              className="my-10 flex w-72 sm:w-80 cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-card p-2 md:my-20 md:p-4"
              aria-label="View invite F7RA"
              style={{
                transformStyle: "preserve-3d",
                transform: "none",
                opacity: 1,
              }}
            >
              <div className="mx-2 flex-1">
                <div className="relative mt-2 aspect-[3/4] w-full">
                  <img
                    loading="lazy"
                    className="absolute inset-0 h-full w-full rounded-[16px] bg-muted object-cover"
                    alt="Invite background"
                    src="https://images.unsplash.com/photo-1505506874110-6a7a69069a08?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    style={{
                      boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                      opacity: 1,
                    }}
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-shrink-0 items-center justify-between p-4 font-mono text-card-foreground">
                <div className="text-xs">Ishaan Gupta</div>
                <div className="text-xs text-muted-foreground opacity-50">#noob</div>
              </div>
            </button>
          </CometCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container px-4 py-12 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © Ishaan Gupta. All rights reserved.
            </p> 
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;