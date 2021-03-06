const Queue = require('./Queue'); 
const { 
    QueueType,
    SchedulerInterrupt,
    PRIORITY_LEVELS,
} = require('./constants/index');

// A class representing the scheduler
// It holds a single blocking queue for blocking processes and three running queues 
// for non-blocking processes
class Scheduler { 
    constructor() { 
        this.clock = Date.now();    // log the time that the last iteration finished  
        this.blockingQueue = new Queue(this, 50, 0, QueueType.BLOCKING_QUEUE);
        this.runningQueues = [];
        // Initialize all the CPU running queues
        for (let i = 0; i < PRIORITY_LEVELS; i++) {
            this.runningQueues[i] = new Queue(this, 10 + i * 20, i, QueueType.CPU_QUEUE);
        }
    }

    // Executes the scheduler in an infinite loop as long as there are processes in any of the queues
    // Calculate the time slice for the next iteration of the scheduler by subtracting the current
    // time from the clock property. Don't forget to update the clock property afterwards.
    // On every iteration of the scheduler, if the blocking queue is not empty, blocking work
    // should be done. Once the blocking work has been done, perform some CPU work in the same iteration.

    run() { // represents the entire thing running
        while (true) {
            const time = Date.now();
            const timeSlice = time - this.clock;   // represents how much time from the last iteration has elapsed with the time right now/ current time
            this.clock = time;

            if (!this.blockingQueue.isEmpty()) {    // if blocking queue is not empty
                this.blockingQueue.doBlockingWork(timeSlice);   // do blocking work with time slice/ input
            }

            for (let i = 0; i < PRIORITY_LEVELS; i++) {
                const queue = this.runningQueues[i];    // grab the running queue
                if (!queue.isEmpty()) { // if queue is not empty
                    queue.doCPUWork(timeSlice); //call do CPU work taking in time slice
                    break;  // break
                } 
            }

            if (this.allQueuesEmpty()) {    // checking if all queues are empty
                console.log('Done!');
                break;
            }
        }
    }

    allQueuesEmpty() {
        return this.runningQueues.every((queue) => queue.isEmpty()) && this.blockingQueue.isEmpty();  // use every array method; takes in a call back on every element in the array of the running queue
    }

    addNewProcess(process) {
        this.runningQueues[0].enqueue(process);
    }

    // The scheduler's interrupt handler that receives a queue, a process, and an interrupt string constant
    // Should handle PROCESS_BLOCKED, PROCESS_READY, and LOWER_PRIORITY interrupts.
    handleInterrupt(queue, process, interrupt) {
        switch(interrupt) {
            case SchedulerInterrupt.PROCESS_BLOCKED:
                this.blockingQueue.enqueue(process);
                break;
            case SchedulerInterrupt.PROCESS_READY:
                this.addNewProcess(process);
                break;
            case SchedulerInterrupt.LOWER_PRIORITY:
                if (queue.getQueueType() === QueueType.CPU_QUEUE) {
                    const priorityLevel = Math.min(PRIORITY_LEVELS - 1, queue.getPriorityLevel() + 1);
                    this.runningQueues[priorityLevel].enqueue(process);
                }  else {
                    this.blockingQueue.enqueue(process);
                }
                break;
            default:
                break;
        }
    } 

    // Private function used for testing; DO NOT MODIFY
    _getCPUQueue(priorityLevel) {
        return this.runningQueues[priorityLevel];
    }

    // Private function used for testing; DO NOT MODIFY
    _getBlockingQueue() {
        return this.blockingQueue;
    }
}

module.exports = Scheduler;
