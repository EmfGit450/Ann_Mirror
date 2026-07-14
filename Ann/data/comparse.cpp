#include <emscripten.h>
#include <iostream>
#include <fstream>
#include <cstdint>
using namespace std;

extern "C" {
  EMSCRIPTEN_KEEPALIVE
  void compress(float* buffer, int neuron_count) {
    vector<uint64_t> output;
    
    output.push_back(static_cast<uint64_t>('V'));
    output.push_back(static_cast<uint64_t>('A'));
    output.push_back(static_cast<uint64_t>('N'));
    output.push_back(static_cast<uint64_t>('N'));
    
    for (int i = 0; i < neuron_count; i += 3) {
      int id = static_cast<int>(buffer[i]);
      int type = buffer[i + 1];
      float pindex1 = buffer[i + 2];
      float pindex2 = buffer[i + 3];
      
      
    }
    
  }
}

int main() {
  uint32_t neuron_count = 3992;
  
  ofstream file("network.vann", ios::binary);
  
  file.write("VANN", 4);
  file.write(reinterpret_cast<const char*>(&neuron_count), sizeof(neuron_count));
  
  file.put(0x1F); 
  
  file.close();
}