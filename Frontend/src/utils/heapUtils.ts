import { Patient, TreatmentBed } from '../types/patient';

// Max heap for waiting queue (higher priority score = higher priority)
export class WaitingQueue {
  private heap: Patient[];

  constructor() {
    this.heap = [];
  }

  private getParentIndex(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  private getLeftChildIndex(index: number): number {
    return 2 * index + 1;
  }

  private getRightChildIndex(index: number): number {
    return 2 * index + 2;
  }

  private swap(index1: number, index2: number): void {
    [this.heap[index1], this.heap[index2]] = [this.heap[index2], this.heap[index1]];
  }

  private heapifyUp(index: number): void {
    if (index === 0) return;
    
    const parentIndex = this.getParentIndex(index);
    const current = this.heap[index];
    const parent = this.heap[parentIndex];
    
    // Max heap: parent should have higher priority score
    if (current.priorityScore > parent.priorityScore || 
        (current.priorityScore === parent.priorityScore && current.waitingTime > parent.waitingTime)) {
      this.swap(index, parentIndex);
      this.heapifyUp(parentIndex);
    }
  }

  private heapifyDown(index: number): void {
    const leftChildIndex = this.getLeftChildIndex(index);
    const rightChildIndex = this.getRightChildIndex(index);
    let maxIndex = index;

    if (leftChildIndex < this.heap.length) {
      const current = this.heap[maxIndex];
      const leftChild = this.heap[leftChildIndex];
      
      if (leftChild.priorityScore > current.priorityScore ||
          (leftChild.priorityScore === current.priorityScore && leftChild.waitingTime > current.waitingTime)) {
        maxIndex = leftChildIndex;
      }
    }

    if (rightChildIndex < this.heap.length) {
      const current = this.heap[maxIndex];
      const rightChild = this.heap[rightChildIndex];
      
      if (rightChild.priorityScore > current.priorityScore ||
          (rightChild.priorityScore === current.priorityScore && rightChild.waitingTime > current.waitingTime)) {
        maxIndex = rightChildIndex;
      }
    }

    if (maxIndex !== index) {
      this.swap(index, maxIndex);
      this.heapifyDown(maxIndex);
    }
  }

  push(patient: Patient): void {
    this.heap.push(patient);
    this.heapifyUp(this.heap.length - 1);
  }

  pop(): Patient | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop() || null;

    const max = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.heapifyDown(0);
    return max;
  }

  peek(): Patient | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  remove(patientId: string): Patient | null {
    const index = this.heap.findIndex(p => p.id === patientId);
    if (index === -1) return null;

    const patient = this.heap[index];
    
    if (index === this.heap.length - 1) {
      this.heap.pop();
      return patient;
    }

    this.heap[index] = this.heap.pop()!;
    this.heapifyUp(index);
    this.heapifyDown(index);
    return patient;
  }

  getAll(): Patient[] {
    return [...this.heap];
  }

  size(): number {
    return this.heap.length;
  }
}

// Min heap for treatment queue (lower remaining time = higher priority)
export class TreatmentQueue {
  private heap: TreatmentBed[];

  constructor() {
    this.heap = [];
  }

  private getParentIndex(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  private getLeftChildIndex(index: number): number {
    return 2 * index + 1;
  }

  private getRightChildIndex(index: number): number {
    return 2 * index + 2;
  }

  private swap(index1: number, index2: number): void {
    [this.heap[index1], this.heap[index2]] = [this.heap[index2], this.heap[index1]];
  }

  private heapifyUp(index: number): void {
    if (index === 0) return;
    
    const parentIndex = this.getParentIndex(index);
    const current = this.heap[index];
    const parent = this.heap[parentIndex];
    
    // Min heap: parent should have lower remaining time
    if (current.remainingTime < parent.remainingTime) {
      this.swap(index, parentIndex);
      this.heapifyUp(parentIndex);
    }
  }

  private heapifyDown(index: number): void {
    const leftChildIndex = this.getLeftChildIndex(index);
    const rightChildIndex = this.getRightChildIndex(index);
    let minIndex = index;

    if (leftChildIndex < this.heap.length && 
        this.heap[leftChildIndex].remainingTime < this.heap[minIndex].remainingTime) {
      minIndex = leftChildIndex;
    }

    if (rightChildIndex < this.heap.length && 
        this.heap[rightChildIndex].remainingTime < this.heap[minIndex].remainingTime) {
      minIndex = rightChildIndex;
    }

    if (minIndex !== index) {
      this.swap(index, minIndex);
      this.heapifyDown(minIndex);
    }
  }

  push(bed: TreatmentBed): void {
    this.heap.push(bed);
    this.heapifyUp(this.heap.length - 1);
  }

  pop(): TreatmentBed | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop() || null;

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.heapifyDown(0);
    return min;
  }

  peek(): TreatmentBed | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  remove(bedId: string): TreatmentBed | null {
    const index = this.heap.findIndex(b => b.id === bedId);
    if (index === -1) return null;

    const bed = this.heap[index];
    
    if (index === this.heap.length - 1) {
      this.heap.pop();
      return bed;
    }

    this.heap[index] = this.heap.pop()!;
    this.heapifyUp(index);
    this.heapifyDown(index);
    return bed;
  }

  updateRemainingTime(bedId: string, newTime: number): void {
    const index = this.heap.findIndex(b => b.id === bedId);
    if (index !== -1) {
      this.heap[index].remainingTime = newTime;
      this.heapifyUp(index);
      this.heapifyDown(index);
    }
  }

  getAll(): TreatmentBed[] {
    return [...this.heap];
  }

  size(): number {
    return this.heap.length;
  }
}

// Auto-sort zones using heap structures
export function sortZones(zones: TriageZone[]): TriageZone[] {
  return zones.map(zone => {
    // Sort waiting queue using max heap
    const waitingQueue = new WaitingQueue();
    zone.waitingQueue.forEach(patient => waitingQueue.push(patient));
    const sortedWaiting = [];
    while (waitingQueue.size() > 0) {
      const patient = waitingQueue.pop();
      if (patient) sortedWaiting.push(patient);
    }

    // Sort treatment queue using min heap by remaining time
    const treatmentQueue = new TreatmentQueue();
    zone.treatmentQueue.forEach(bed => {
      if (bed.patient) treatmentQueue.push(bed);
    });
    const sortedTreatment = [];
    while (treatmentQueue.size() > 0) {
      const bed = treatmentQueue.pop();
      if (bed) sortedTreatment.push(bed);
    }
    
    // Add empty beds back
    const emptyBeds = zone.treatmentQueue.filter(bed => !bed.patient);
    sortedTreatment.push(...emptyBeds);

    return {
      ...zone,
      waitingQueue: sortedWaiting,
      treatmentQueue: sortedTreatment
    };
  });
}