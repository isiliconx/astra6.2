#include "RelayRoom.h"
#include "ProceduralMeshComponent.h"
#include "Components/InstancedStaticMeshComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/SceneComponent.h"
#include "Components/DirectionalLightComponent.h"
#include "Components/PointLightComponent.h"
#include "Engine/CollisionProfile.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInterface.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

ARelayRoom::ARelayRoom()
{
    PrimaryActorTick.bCanEverTick=true;
    RootComponent=CreateDefaultSubobject<USceneComponent>(TEXT("Chamber"));
    Seal=CreateDefaultSubobject<UProceduralMeshComponent>(TEXT("BlenderSeal"));
    Seal->SetupAttachment(RootComponent); Seal->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    Seal->SetRelativeLocation(FVector(1015,0,133));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cylinder(TEXT("/Engine/BasicShapes/Cylinder"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Sphere(TEXT("/Engine/BasicShapes/Sphere"));
    static ConstructorHelpers::FObjectFinder<UMaterialInterface> Paint(TEXT("/Engine/BasicShapes/BasicShapeMaterial"));
    Shapes.Add(Cube.Object); Shapes.Add(Cylinder.Object); Shapes.Add(Sphere.Object); BaseMaterial=Paint.Object;
}

void ARelayRoom::BeginPlay()
{
    Super::BeginPlay();
    const FLinearColor Colors[FinishCount]={
        {.057f,.065f,.082f},{.20f,.145f,.115f},{.60f,.38f,.19f},
        {.76f,.35f,.095f},{.48f,.74f,.79f},{.88f,.72f,.37f},
        {.04f,2.8f,1.77f},{.34f,1.15f,2.8f},{2.f,.61f,.075f},{.11f,.16f,.19f},{.88f,.80f,.59f}
    };
    for(const auto& Color:Colors)
    {
        auto* Material=BaseMaterial?UMaterialInstanceDynamic::Create(BaseMaterial,this):nullptr;
        if(Material) Material->SetVectorParameterValue(TEXT("Color"),Color);
        Materials.Add(Material);
    }
    BuildSeal();
    BuildGallery();
    LoadChamber(0);
}
void ARelayRoom::Stamp(Form S, Finish F, FVector P, FVector Size, FRotator R, bool Solid)
{
    const int32 Key=static_cast<int32>(S)*100+static_cast<int32>(F)*2+(Solid?1:0);
    if(!Batches.Contains(Key))
    {
        auto* C=NewObject<UInstancedStaticMeshComponent>(this);
        C->SetupAttachment(RootComponent); C->SetMobility(EComponentMobility::Movable);
        C->SetStaticMesh(Shapes[S]); if(Materials[F]) C->SetMaterial(0,Materials[F]);
        C->SetCollisionProfileName(Solid?UCollisionProfile::BlockAll_ProfileName:UCollisionProfile::NoCollision_ProfileName);
        C->SetGenerateOverlapEvents(false); C->SetCanEverAffectNavigation(false);
        AddInstanceComponent(C); C->RegisterComponent(); Batches.Add(Key,C);
    }
    Batches[Key]->AddInstance(FTransform(R,P,Size/100.));
}
UStaticMeshComponent* ARelayRoom::Piece(Form S,Finish F,FVector P,FVector Size,bool Dynamic,bool Solid,FRotator R)
{
    auto* C=NewObject<UStaticMeshComponent>(this);
    C->SetupAttachment(RootComponent); C->SetMobility(EComponentMobility::Movable);
    C->SetStaticMesh(Shapes[S]); if(Materials[F]) C->SetMaterial(0,Materials[F]);
    C->SetCollisionProfileName(Solid?UCollisionProfile::BlockAll_ProfileName:UCollisionProfile::NoCollision_ProfileName);
    C->SetGenerateOverlapEvents(false); C->SetCanEverAffectNavigation(false);
    C->SetRelativeTransform(FTransform(R,P,Size/100.)); AddInstanceComponent(C); C->RegisterComponent();
    (Dynamic?Changing:Fixtures).Add(C);
    return C;
}
void ARelayRoom::Lamp(FVector P,FLinearColor Color,float Power,float Radius)
{
    auto* L=NewObject<UPointLightComponent>(this);
    L->SetupAttachment(RootComponent); L->SetMobility(EComponentMobility::Movable);
    L->SetRelativeLocation(P); L->SetLightColor(Color); L->SetIntensity(Power);
    L->SetAttenuationRadius(Radius); L->SetCastShadows(false); AddInstanceComponent(L); L->RegisterComponent();
}
void ARelayRoom::BuildGallery()
{
    // Open-roof cloister, quarry-cut piers, recessed floor joints and brass transit marks.
    Stamp(Box,Shale,{0,0,-15},{2440,1820,30},FRotator::ZeroRotator,true);
    for(int x=-5;x<=5;++x) for(int y=-4;y<=4;++y)
        Stamp(Box,(x+y)%3?Basalt:Shale,{x*210.,y*180.,.25},{208.,178.,.5});
    for(int s:{-1,1})
    {
        Stamp(Box,Basalt,{0,s*855.,45},{2400,80,90},FRotator::ZeroRotator,true);
        Stamp(Box,Basalt,{s*1180.,0,44},{85,1720,88},FRotator::ZeroRotator,true);
        Stamp(Box,Sand,{0,s*870.,411},{2420,63,25});
        Stamp(Box,Bronze,{0,s*841.,403},{2415,8,6});
        for(int b=-3;b<=3;++b)
        {
            const double x=b*360., y=s*850., height=365.+((b+3)%3)*41.;
            Stamp(Box,Sand,{x,y,22},{121,112,44},FRotator::ZeroRotator,true);
            Stamp(Box,Basalt,{x,y,height*.5},{78,85,height},FRotator(0,0,s*4.),true);
            Stamp(Box,Sand,{x,s*806.,height*.5},{38,14,height-28});
            Stamp(Box,Bronze,{x,s*796.,119},{64,5,5});
            for(int j=0;j<3;++j) Stamp(Box,Shale,{x+(j-1)*12.,s*797.,223},{4,5,130});
        }
        for(int b=-3;b<=3;++b) if(b!=0)
        {
            const double y=b*237., h=310.+(FMath::Abs(b)%2)*92.;
            Stamp(Box,Basalt,{s*1169.,y,h/2},{102,58,h},FRotator::ZeroRotator,true);
            Stamp(Box,Sand,{s*1123.,y,h-30},{19,73,51});
        }
        for(int i=-9;i<=9;++i) Stamp(Box,Bronze,{i*117.,s*715.,1.},{i%3==0?64.:18.,5,2});
    }
    for(int i=0;i<9;++i)
    {
        const float w=12.f+(i%3)*7.f;
        Stamp(Box,Line,{796.+i*22.,-80.,1.3},{4,w,2});
        Stamp(Box,Line,{796.+i*22.,80.,1.3},{4,w,2});
    }

    // Entrance/receiver lintel: keyed octagonal throat and crown, no Starter Content.
    for(int s:{-1,1})
    {
        Stamp(Box,Shale,{1030,s*107.,120},{56,31,240},FRotator::ZeroRotator,true);
        Stamp(Box,Bronze,{1005,s*99.,119},{10,7,218});
        Stamp(Box,Shale,{1030,s*85.,245},{56,30,70},FRotator(0,0,s*40.));
    }
    Stamp(Box,Shale,{1030,0,271},{56,160,33});
    Stamp(Box,Bronze,{998,0,268},{9,117,6});
    Stamp(Box,Sand,{1030,0,4},{106,260,8},FRotator::ZeroRotator,true);
    // Distant ridgelines: nonblocking silhouettes beyond the colonnade. Seeded, not assets.
    FRandomStream Random(4217);
    for(int k=0;k<98;++k)
    {
        const double a=2.*PI*k/98., r=Random.FRandRange(3500.f,5900.f);
        const float h=Random.FRandRange(100.f,810.f);
        Stamp(Orb,k%4==0?Sand:Basalt,{std::cos(a)*r,std::sin(a)*r,h*.08-110.},
              {Random.FRandRange(800,1800),Random.FRandRange(700,1500),h},FRotator(0,k*19.,0));
    }
    Stamp(Orb,Chalk,{7900,-2480,2700},{760,760,760});
    for(int k=0;k<145;++k)
    {
        const float a=Random.FRandRange(-PI,PI), e=Random.FRandRange(.13f,1.49f), r=9800;
        float size=Random.FRandRange(6,19);
        Stamp(Orb,Chalk,{r*std::cos(a)*std::cos(e),r*std::sin(a)*std::cos(e),r*std::sin(e)},{size,size,size});
    }
    auto* Key=NewObject<UDirectionalLightComponent>(this);
    Key->SetupAttachment(RootComponent); Key->SetMobility(EComponentMobility::Movable);
    Key->SetRelativeRotation(FRotator(-46,-38,0)); Key->SetLightColor(FLinearColor(1.f,.84f,.62f));
    Key->SetIntensity(5.f); AddInstanceComponent(Key); Key->RegisterComponent();
    Lamp({-580,-250,390},{.65f,.78f,1.f},22000,1900);
    Lamp({430,100,430},{1.f,.76f,.48f},18000,1700);
    Lamp({970,0,175},{.12f,.72f,1.f},1200,470);
}
void ARelayRoom::LoadChamber(int32 I)
{
    Chapter=FMath::Clamp(I,0,2); Layout=relay::chamber(Chapter); Actions=0; ShutterLift=0;
    RebuildApparatus();
}
void ARelayRoom::RebuildApparatus()
{
    Shutter=nullptr;
    for(auto C:Fixtures) if(IsValid(C)) C->DestroyComponent();
    Fixtures.Reset();
    for(int i=0;i<Layout.mirrors;++i)
    {
        const auto p=Layout.m[i].p;
        Piece(Drum,Shale,World(p,11),{95,95,22},false,true);
        Piece(Drum,Bronze,World(p,26),{56,56,12},false,true);
        Piece(Drum,Basalt,World(p,52),{19,19,45},false,true);
        // An eight-division calibration drum around each mirror.
        for(int j=0;j<8;++j)
        {
            const double a=j*PI/4.;
            Piece(Box,Line,World(p,23)+FVector(39*std::cos(a),39*std::sin(a),0),{11,3,1.8},false,false,FRotator(0,j*45,0));
        }
    }
    for(int i=0;i<Layout.sources+Layout.targets;++i)
    {
        const bool source=i<Layout.sources; const auto p=source?Layout.e[i].p:Layout.r[i-Layout.sources];
        Piece(Drum,Shale,World(p,9),{89,89,18},false,true);
        Piece(Drum,Basalt,World(p,52),{39,39,71},false,true);
        Piece(Drum,Bronze,World(p,88),{74,74,9},false,true);
        Piece(Drum,Bronze,World(p,163),{68,68,7},false);
        for(int s:{-1,1}) for(int t:{-1,1})
            Piece(Box,Shale,World(p,124)+FVector(s*24.,t*18.,0),{4,4,70},false);
        if(source)
        {
            Piece(Orb,i==0?Photon:Violet,World(p,125),{46,46,46},false);
            const FVector d=World(Layout.e[i].dir,0).GetSafeNormal();
            Piece(Box,Line,World(p,2)+d*74,{62,9,2},false,false,d.Rotation());
        }
    }
    Shutter=Piece(Box,Basalt,{1030,0,133},{24,178,250},false,true);
    UpdateLight();
}
void ARelayRoom::UpdateLight()
{
    for(auto C:Changing) if(IsValid(C)) C->DestroyComponent();
    Changing.Reset();
    Light=relay::trace(Layout);
    for(int i=0;i<Layout.mirrors;++i)
    {
        const auto m=Layout.m[i]; const double yaw=90.-m.step*22.5; const FRotator r(0,yaw,0);
        Piece(Box,Bronze,World(m.p,125),{184,15,119},true,true,r);
        Piece(Box,Silver,World(m.p,125),{166,18,102},true,false,r);
        const FVector t=r.Vector(), n=FVector::CrossProduct(FVector::UpVector,t);
        // Ambidextrous, off-axis notches let you count an individual turn from either face.
        for(int j=0;j<=i;++j) for(int s:{-1,1})
            Piece(Box,Line,World(m.p,80)+t*(-57.+j*12.)+n*(s*10.),{6,2,12},true,false,r);
    }
    for(int i=0;i<Layout.targets;++i)
    {
        auto p=Layout.r[i]; const Finish f=Light.lit[i]?Photon:Amber;
        Piece(Box,f,World(p,125),{34,34,34},true,false,FRotator(35,45,0));
        Piece(Drum,f,World(p,91),{75,75,3},true);
    }
    for(int i=0;i<Light.count;++i)
    {
        const auto line=Light.lines[i]; const FVector a=World(line.from,125), b=World(line.to,125);
        const FVector d=b-a;
        Piece(Box,line.channel==0?Photon:Violet,(a+b)*.5,{d.Size(),3.,3.},true,false,d.Rotation())->SetCastShadow(false);
    }
    const Finish f=IsOpen()?Photon:Amber;
    for(int s:{-1,1}) Piece(Box,f,{995,s*94.,123},{5,5,231},true);
}
void ARelayRoom::TurnMirror(int32 Which,int32 Delta)
{
    if(Which<0||Which>=Layout.mirrors) return;
    relay::rotate(Layout,Which,Delta); ++Actions; UpdateLight();
}
int32 ARelayRoom::FocusedMirror(const FVector& Eye,const FVector&) const
{
    int32 selected=INDEX_NONE; double best=205.;
    for(int i=0;i<Layout.mirrors;++i)
    {
        const double distance=FVector::Dist2D(World(Layout.m[i].p,125),Eye);
        if(distance<best) { best=distance; selected=i; }
    }
    return selected;
}
bool ARelayRoom::IsOnThreshold(const FVector& P) const
{ return IsOpen() && ShutterLift>0.87f && P.X>=1008. && FMath::Abs(P.Y)<84. && P.Z<175.; }
void ARelayRoom::Tick(float Dt)
{
    Super::Tick(Dt);
    ShutterLift=FMath::FInterpConstantTo(ShutterLift,IsOpen()?1.f:0.f,Dt,1.2f);
    if(Shutter)
    {
        Seal->SetRelativeLocation(FVector(1015,0,133+258.*ShutterLift));
        Shutter->SetRelativeLocation(FVector(1030,0,133+258.*ShutterLift));
        Shutter->SetCollisionEnabled(ShutterLift>.87f?ECollisionEnabled::NoCollision:ECollisionEnabled::QueryAndPhysics);
    }
}
