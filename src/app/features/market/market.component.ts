import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

interface Stack {
  id: number;
  name: string;
  category: 'Frontend' | 'Backend' | 'Systems' | 'Fullstack';
  activeDevs: number;
  openBattles: number;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  popularity: number; // percentage or rating
  color: string; // Theme color for card accents
}

@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.scss']
})
export class MarketComponent implements OnInit, AfterViewInit {
  stacks: Stack[] = [
    {
      id: 1,
      name: 'Python',
      category: 'Backend',
      activeDevs: 14205,
      openBattles: 24,
      description: 'Dynamic scripting, AI algorithms, data pipelines and clean, readable code battles.',
      difficulty: 'Beginner',
      popularity: 92,
      color: '#3b82f6'
    },
    {
      id: 2,
      name: 'JavaScript',
      category: 'Frontend',
      activeDevs: 18940,
      openBattles: 41,
      description: 'Web scripting, functional loops, async handlers and event-driven clashing.',
      difficulty: 'Beginner',
      popularity: 95,
      color: '#eab308'
    },
    {
      id: 3,
      name: 'TypeScript',
      category: 'Fullstack',
      activeDevs: 15430,
      openBattles: 35,
      description: 'Strongly typed JavaScript ecosystems, advanced interfaces, and utility compiler clashing.',
      difficulty: 'Intermediate',
      popularity: 89,
      color: '#2563eb'
    },
    {
      id: 4,
      name: 'Go',
      category: 'Backend',
      activeDevs: 8430,
      openBattles: 19,
      description: 'High-performance concurrency channels, sleek structures, and fast compilation arenas.',
      difficulty: 'Intermediate',
      popularity: 84,
      color: '#06b6d4'
    },
    {
      id: 5,
      name: 'Rust',
      category: 'Systems',
      activeDevs: 5920,
      openBattles: 12,
      description: 'Strict borrow checker rules, zero-cost abstractions, memory safety, and optimal execution clashing.',
      difficulty: 'Advanced',
      popularity: 78,
      color: '#f97316'
    },
    {
      id: 6,
      name: 'C++',
      category: 'Systems',
      activeDevs: 7120,
      openBattles: 15,
      description: 'Low-level pointer operations, custom memory structures, templates and algorithmic complexity optimization.',
      difficulty: 'Advanced',
      popularity: 81,
      color: '#00599c'
    },
    {
      id: 7,
      name: 'Java',
      category: 'Backend',
      activeDevs: 11200,
      openBattles: 22,
      description: 'Object-oriented structures, robust multi-threading, design pattern challenges and virtual machine arenas.',
      difficulty: 'Intermediate',
      popularity: 86,
      color: '#f43f5e'
    }
  ];

  filteredStacks: Stack[] = [];
  selectedCategory = 'All';
  searchQuery = '';

  @ViewChild('marketChart') marketChart!: ElementRef<HTMLCanvasElement>;
  chartInstance: Chart | null = null;

  ngOnInit() {
    this.filteredStacks = [...this.stacks];
  }

  ngAfterViewInit() {
    this.initChart();
  }

  applyFilters() {
    this.filteredStacks = this.stacks.filter(s => {
      const matchCat = this.selectedCategory === 'All' || s.category === this.selectedCategory;
      const matchSearch = s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                          s.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    this.updateChart();
  }

  initChart() {
    if (!this.marketChart) return;
    
    const ctx = this.marketChart.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.filteredStacks.map(s => s.name),
        datasets: [{
          label: 'Active Developers',
          data: this.filteredStacks.map(s => s.activeDevs),
          backgroundColor: this.filteredStacks.map(s => s.color + 'cc'),
          borderColor: this.filteredStacks.map(s => s.color),
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 4,
            usePointStyle: true
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: '#94a3b8',
              font: {
                family: "'Inter', sans-serif"
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#94a3b8',
              font: {
                family: "'Inter', sans-serif",
                weight: 'bold'
              }
            }
          }
        },
        animation: {
          duration: 400
        }
      }
    });
  }

  updateChart() {
    if (!this.chartInstance) return;

    this.chartInstance.data.labels = this.filteredStacks.map(s => s.name);
    this.chartInstance.data.datasets[0].data = this.filteredStacks.map(s => s.activeDevs);
    this.chartInstance.data.datasets[0].backgroundColor = this.filteredStacks.map(s => s.color + 'cc');
    this.chartInstance.data.datasets[0].borderColor = this.filteredStacks.map(s => s.color);
    
    this.chartInstance.update();
  }
}
