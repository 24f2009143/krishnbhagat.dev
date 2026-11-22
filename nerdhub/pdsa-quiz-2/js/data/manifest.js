PDSA.manifest={
 exam:"PDSA Quiz 2",
 papers:["July 2022","Aug 2023","Dec 2023","24 Mar 2024","04 Aug 2024","01 Dec 2024","16 Mar 2025","03 Aug 2025","06 Apr 2026","14 Aug 2026"],
 expected:{pyqs:159,marks:500,papers:10},
 topics:[
  {id:"divide-conquer",name:"Divide and Conquer and Recurrences",short:"Divide & Conquer",accent:"#2f6fdf",marks:121,uses:[],
   why:"Teaches how to measure an algorithm's cost with recurrences. Every later topic is judged with these tools.",
   subs:[["Recurrence Relations & Asymptotic Complexity",13],["Counting Inversions",10],["Quick Select & Median of Medians (MoM)",12],["Closest Pair of Points",4]]},
  {id:"trees",name:"Trees: Binary, BST and AVL",short:"Trees",accent:"#1c9a6c",marks:102,uses:["divide-conquer"],
   why:"Trees keep data in an order so search is fast. AVL trees keep them balanced. Heaps and spanning trees are tree ideas too.",
   subs:[["Binary Tree Properties",5],["Binary Search Tree (BST) Properties & Complexity",12],["Tree Traversals",5],["AVL Trees: Height, Slope & Node Bounds",6],["AVL Trees: Insertion & Rotations",5]]},
  {id:"heaps",name:"Heaps and Priority Queues",short:"Heaps",accent:"#c9811a",marks:59,uses:["trees"],
   why:"A heap gives the smallest or largest item fast. Greedy algorithms and shortest paths lean on it.",
   subs:[["Min-Heap Operations & Properties",9],["Max-Heap Operations & Properties",6],["Binary Heap Structure & Heap Sort",4]]},
  {id:"greedy",name:"Greedy Algorithms",short:"Greedy",accent:"#b04a8f",marks:84,uses:["heaps"],
   why:"Pick the best-looking choice at each step. You learn when that works (Huffman, scheduling) and when it fails.",
   subs:[["Huffman Coding",11],["Interval Scheduling & Meeting Rooms",9],["Minimizing Maximum Lateness",3],["General Greedy Concepts & Counter-Examples",3]]},
  {id:"graphs",name:"Graph Algorithms",short:"Graphs",accent:"#d0463b",marks:134,uses:["heaps","greedy","trees"],
   why:"Shortest paths and minimum spanning trees. The biggest share of marks, and it reuses heaps and greedy thinking.",
   subs:[["Dijkstra's Algorithm",10],["Bellman-Ford & Floyd-Warshall Algorithms",5],["Shortest Path Algorithms: General & Comparisons",6],["Minimum Spanning Trees (MST) & Prim's Algorithm",20],["Disjoint Set Union (DSU)",1]]}
 ]
};
