// Compile with any C++17 compiler. This exercises the exact header used by ARelayRoom.
#include "../Source/SableRelay/RelayOptics.h"
#include <iostream>
#include <string>
#include <iomanip>

int main(int argc,char** argv)
{
    using namespace relay;
    const bool stream=argc>1 && std::string(argv[1])=="--states";
    const int expected[3][4]={{2,0,0,0},{2,2,0,0},{2,2,6,6}};
    const int clicks[3]={1,3,11}; int states=0;
    for(int n=0;n<3;++n)
    {
        auto initial=chamber(n);
        if(trace(initial).complete(initial)) return 1;
        int count=1; for(int m=0;m<initial.mirrors;++m) count*=8;
        int wins=0, witnessed=0;
        for(int mask=0;mask<count;++mask)
        {
            Chamber c=initial; int key=mask;
            for(int m=0;m<c.mirrors;++m) { c.m[m].step=key%8; key/=8; }
            const auto result=trace(c); ++states;
            if(result.count>c.sources*MaxSegments || result.count<c.sources) return 2;
            for(int j=0;j<result.count;++j)
            {
                const auto ray=result.lines[j];
                if(!std::isfinite(ray.to.x)||!std::isfinite(ray.to.y)||
                   std::abs(ray.to.x)>EastWall+1e-5 || std::abs(ray.to.y)>NorthWall+1e-5 ||
                   dot(ray.to-ray.from,ray.to-ray.from)<1e-10) return 3;
            }
            if(result.complete(c))
            {
                ++wins;
                bool match=true; for(int m=0;m<c.mirrors;++m) match&=c.m[m].step==expected[n][m];
                if(match) ++witnessed;
            }
            if(stream)
            {
                std::cout << n << ' ' << mask << ' ';
                int lit=0; for(int j=0;j<c.targets;++j) if(result.lit[j]) lit|=1<<j;
                std::cout << lit << ' ' << result.count;
                for(int j=0;j<result.count;++j) std::cout << ' ' << std::setprecision(12) << result.lines[j].to.x << ' ' << result.lines[j].to.y;
                std::cout << '\n';
            }
        }
        if(wins!=1 || witnessed!=1) return 4;
        auto replay=initial; int turns=0;
        for(int m=0;m<replay.mirrors;++m)
        {
            rotate(replay,m,-1); rotate(replay,m,1);
            if(replay.m[m].step!=initial.m[m].step) return 5;
            while(replay.m[m].step!=expected[n][m]) { rotate(replay,m,1); ++turns; }
        }
        if(turns!=clicks[n] || !trace(replay).complete(replay)) return 6;
        rotate(replay,0,1); if(trace(replay).complete(replay)) return 7;
        if(!stream) std::cout<<initial.name<<": "<<count<<" states / "<<wins<<" solution / "<<turns<<" forward turns\n";
    }
    if(states!=4168) return 8;
    if(!stream) std::cout<<"PASS -- all 4168 states; unique witnesses, forward/reverse turns and gate relock.\n";
    return 0;
}
