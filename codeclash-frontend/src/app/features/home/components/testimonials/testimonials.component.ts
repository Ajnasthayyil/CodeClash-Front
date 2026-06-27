import { Component } from '@angular/core';

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent {
  testimonials = [
    {
      quote: "CodeClash reduced our technical screening time by 60%. The interactive sandbox environment is a game-changer for evaluating candidates' real-world performance.",
      author: "Sarah Jenkins",
      role: "VP of Engineering at CloudScale",
      avatar: "SJ"
    },
    {
      quote: "The collaborative whiteboard IDE interviews run smoothly without any lag. It feels like pair programming in person.",
      author: "David Chen",
      role: "Lead Architect at DevFlow",
      avatar: "DC"
    },
    {
      quote: "We hosted a company-wide coding arena tournament using CodeClash, and the engagement was incredible. Our developers loved the competitive real-time battles.",
      author: "Elena Rostova",
      role: "VP of Talent at TechSphere",
      avatar: "ER"
    }
  ];
}
