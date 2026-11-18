// Engine-independent optical kernel shared by the native game and its portable tests.
// Coordinates: x = east, y = north, metres; angles are counterclockwise from east.
#pragma once
#include <array>
#include <cmath>
#include <algorithm>

namespace relay
{
constexpr double Pi = 3.14159265358979323846;
constexpr double Epsilon = 1e-5;
constexpr double HalfMirror = 0.90;
constexpr double ReceiverRadius = 0.30;
constexpr double EastWall = 8., NorthWall = 11.;
constexpr int MaxMirrors = 4, MaxSources = 2, MaxTargets = 2, MaxSegments = 16;
struct V2
{
    double x=0, y=0;
    V2 operator+(V2 v) const { return {x+v.x,y+v.y}; }
    V2 operator-(V2 v) const { return {x-v.x,y-v.y}; }
    V2 operator*(double k) const { return {x*k,y*k}; }
};
inline double dot(V2 a,V2 b) { return a.x*b.x+a.y*b.y; }
inline double cross(V2 a,V2 b) { return a.x*b.y-a.y*b.x; }
inline V2 tangent(int step) { double t=step*Pi/8.; return {std::cos(t),std::sin(t)}; }
struct Mirror { V2 p; int step=0; }; // 8 discrete positions; 180 degrees = one full cycle
struct Source { V2 p; V2 dir; };
struct Chamber
{
    const char* name="";
    int mirrors=0, sources=0, targets=0;
    std::array<Mirror, MaxMirrors> m{};
    std::array<Source, MaxSources> e{};
    std::array<V2, MaxTargets> r{};
};
inline Chamber chamber(int n)
{
    Chamber c;
    if(n==0)
    {
        c.name="FIRST LIGHT"; c.mirrors=1; c.sources=c.targets=1;
        c.m[0]={{-1,-1},1}; c.e[0]={{-6.4,-1},{1,0}}; c.r[0]={-1,6.6};
    }
    else if(n==1)
    {
        c.name="SWITCHBACK"; c.mirrors=2; c.sources=c.targets=1;
        c.m[0]={{-2.7,-4},1}; c.m[1]={{-2.7,4},0}; c.e[0]={{-6.4,-4},{1,0}}; c.r[0]={5.8,4};
    }
    else
    {
        c.name="PARALLAX"; c.mirrors=4; c.sources=c.targets=2;
        c.m[0]={{-3,-5},0}; c.m[1]={{-3,3},7}; c.m[2]={{5,-1},4}; c.m[3]={{1,-1},2};
        c.e[0]={{-6.6,-5},{1,0}}; c.e[1]={{5,-7},{0,1}}; c.r[0]={6.6,3}; c.r[1]={1,8};
    }
    return c;
}
inline void rotate(Chamber& c,int i,int delta)
{ if(i>=0 && i<c.mirrors) c.m[i].step=((c.m[i].step+delta)%8+8)%8; }

struct Segment { V2 from, to; int channel; };
struct Trace
{
    std::array<Segment, MaxSources*MaxSegments> lines{};
    std::array<bool, MaxTargets> lit{};
    int count=0;
    bool complete(const Chamber& c) const
    {
        for(int i=0;i<c.targets;++i) if(!lit[i]) return false;
        return c.targets>0;
    }
};
inline Trace trace(const Chamber& c)
{
    Trace result;
    for(int ch=0;ch<c.sources;++ch)
    {
        V2 pos=c.e[ch].p, dir=c.e[ch].dir;
        int previous=-1;
        std::array<std::array<long,5>, MaxSegments> seen{}; int visits=0;
        for(int bounce=0;bounce<MaxSegments;++bounce)
        {
            double t=1e6;
            if(std::abs(dir.x)>Epsilon) t=std::min(t,((dir.x>0?EastWall:-EastWall)-pos.x)/dir.x);
            if(std::abs(dir.y)>Epsilon) t=std::min(t,((dir.y>0?NorthWall:-NorthWall)-pos.y)/dir.y);
            int mirror=-1, target=-1;
            for(int i=0;i<c.mirrors;++i)
            {
                if(i==previous) continue;
                const V2 axis=tangent(c.m[i].step), off=c.m[i].p-pos;
                const double den=cross(dir,axis);
                if(std::abs(den)<Epsilon) continue; // parallel or grazing ray
                const double dist=cross(off,axis)/den, arm=cross(off,dir)/den;
                if(dist>Epsilon && dist<t && std::abs(arm)<=HalfMirror+Epsilon)
                { t=dist; mirror=i; }
            }
            for(int i=0;i<c.targets+c.sources;++i)
            {
                const bool receiver=i<c.targets;
                if(!receiver && bounce==0 && i-c.targets==ch) continue;
                const V2 off=(receiver?c.r[i]:c.e[i-c.targets].p)-pos;
                const double radius=receiver?ReceiverRadius:.26;
                const double side=cross(off,dir);
                const double along=dot(off,dir), h2=radius*radius-side*side;
                if(h2<0.) continue;
                const double near=along-std::sqrt(h2);
                if(near>Epsilon && near<t) { t=near; target=receiver?i:-1; mirror=-1; }
            }
            if(!std::isfinite(t) || t<Epsilon) break;
            const V2 end=pos+dir*t;
            result.lines[result.count++]={pos,end,ch};
            if(target>=0) { result.lit[target]=true; break; }
            if(mirror<0) break;
            const V2 axis=tangent(c.m[mirror].step);
            dir=axis*(2.*dot(dir,axis))-dir;
            dir=dir*(1./std::sqrt(dot(dir,dir)));
            const std::array<long,5> key{{mirror,std::lround(end.x*1e4),std::lround(end.y*1e4),std::lround(dir.x*1e4),std::lround(dir.y*1e4)}};
            if(std::find(seen.begin(),seen.begin()+visits,key)!=seen.begin()+visits) break;
            seen[visits++]=key; pos=end; previous=mirror;
        }
    }
    return result;
}
}
