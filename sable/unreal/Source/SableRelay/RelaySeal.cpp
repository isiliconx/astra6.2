#include "RelayRoom.h"
#include "ProceduralMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/MemoryReader.h"

// This CPU-baked asset retains the actual Blender mesh positions, bevel normals and face
// assignments. Five draw sections replace 88 scene objects. It is not a screenshot/decal.
void ARelayRoom::BuildSeal()
{
    TArray<uint8> Bytes;
    const FString Path=FPaths::Combine(FPaths::ProjectContentDir(),TEXT("Relay/seal.srm"));
    if(!FFileHelper::LoadFileToArray(Bytes,*Path) || Bytes.Num()<8 ||
       FMemory::Memcmp(Bytes.GetData(),"SRM1",4)!=0) return;
    FMemoryReader Reader(Bytes,true); Reader.Seek(4);
    uint32 Count=0; Reader<<Count; if(Count!=5) return;
    const Finish Palette[]={Shale,Bronze,Line,Chalk,Basalt};
    for(uint32 s=0;s<Count;++s)
    {
        uint32 NV=0,NI=0; Reader<<NV<<NI;
        if(!NV || NV>65535 || !NI || NI>250000 || NI%3 || Reader.Tell()+NV*12+NI*2>Bytes.Num()) return;
        TArray<FVector> P,N; TArray<int32> I; P.Reserve(NV); N.Reserve(NV); I.Reserve(NI);
        for(uint32 v=0;v<NV;++v)
        {
            int16 A,B,C,D,E,F; Reader<<A<<B<<C<<D<<E<<F;
            P.Add(FVector(A,B,C)*(77./30000.)); N.Add(FVector(D,E,F).GetSafeNormal());
        }
        for(uint32 idx=0;idx<NI;++idx) { uint16 value=0; Reader<<value; if(value>=NV) return; I.Add(value); }
        const TArray<FVector2D> UV; const TArray<FLinearColor> Colors; const TArray<FProcMeshTangent> Tangents;
        Seal->CreateMeshSection_LinearColor(s,P,I,N,UV,Colors,Tangents,false);
        if(Materials[Palette[s]]) Seal->SetMaterial(s,Materials[Palette[s]]);
    }
}
